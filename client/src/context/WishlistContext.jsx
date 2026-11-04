import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { wishlistApi } from "../api/customer";
import { useAuth } from "./AuthContext";

/*
 * Wishlist state. Signed-out customers keep hearts in localStorage;
 * after sign-in those guest hearts merge into the server wishlist, so
 * nothing they saved while browsing anonymously is lost.
 */
const WishlistContext = createContext(null);
const GUEST_KEY = "cartivo-guest-wishlist";

function readGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
  } catch {
    // private mode: wishlist still works for this visit
  }
}

function productIdsFromResponse(data) {
  return (data?.items || [])
    .map((item) => String(item.product?._id || item.product))
    .filter(Boolean);
}

function displayItemsFor(wishlist) {
  return (wishlist?.items || [])
    .filter((item) => item.product && item.product.status === "active")
    .map((item) => String(item.product._id || item.product));
}

export function WishlistProvider({ children }) {
  const { user, openAuth } = useAuth();
  const [guestIds, setGuestIds] = useState(readGuestWishlist);
  const [items, setItems] = useState([]);
  const userId = user?.id ? String(user.id) : null;

  useEffect(() => {
    if (!userId) {
      // signed out (or not yet loaded): show the guest hearts
      setItems(readGuestWishlist());
      return;
    }

    let active = true;

    wishlistApi
      .get()
      .then((response) => {
        if (!active) return;
        const serverIds = productIdsFromResponse(response.data);
        const guestList = readGuestWishlist();
        const missing = guestList.filter((id) => !serverIds.includes(id));
        // optimistic merge so hearts are correct immediately
        setItems(mergeIds(serverIds, missing));

        if (missing.length) {
          // push guest hearts to the server, then re-sync
          const settled = Promise.allSettled(missing.map((id) => wishlistApi.add(id)));
          settled
            .then(() => wishlistApi.get())
            .then((refreshed) => {
              if (!active) return;
              setItems(productIdsFromResponse(refreshed.data));
              writeGuestWishlist([]); // merged; clear the local copy
            })
            .catch(() => {
              // keep the merged view; will resync on next login
            });
        } else {
          writeGuestWishlist([]);
        }
      })
      .catch(() => {
        if (active) setItems(readGuestWishlist());
      });

    return () => {
      active = false;
    };
  }, [userId]);

  function mergeIds(serverList, guestList) {
    const seen = new Set();
    const merged = [];
    for (const id of [...serverList, ...guestList]) {
      if (id && !seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }
    return merged;
  }

  function isWishlisted(productId) {
    return items.some((id) => String(id) === String(productId));
  }

  const toggle = useCallback(
    (productId) => {
      const id = String(productId);
      const isOn = isWishlisted(id);
      // optimistic flip so the heart responds instantly
      setItems((prev) => (isOn ? prev.filter((x) => String(x) !== id) : [...prev, id]));

      if (!userId) {
        // signed out: persist the hearts locally and prompt sign-in
        const next = isOn ? guestIds.filter((x) => String(x) !== id) : [...guestIds, id];
        setGuestIds(next);
        writeGuestWishlist(next);
        if (!isOn) {
          // the merge effect picks the localStorage list up after sign-in;
          // no extra action required on authenticated
          openAuth(null, "login");
        }
        return;
      }

      const request = isOn ? wishlistApi.remove(id) : wishlistApi.add(id);
      request
        .then((response) => {
          setItems(productIdsFromResponse(response.data));
        })
        .catch(() => {
          // revert so the heart stays honest when the server rejects
          setItems((prev) => (isOn ? [...prev, id] : prev.filter((x) => String(x) !== id)));
        });
    },
    [userId, guestIds, openAuth, items]
  );

  const value = useMemo(
    () => ({ items, isWishlisted, toggle, count: items.length }),
    [items, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
