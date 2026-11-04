import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { wishlistApi, authApi } from "../api/customer";
import { api } from "../api/client";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductImage from "../components/product/ProductImage";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/*
 * The wishlist itself needs a session: this page loads live product
 * data for each saved id, and shows a signed-out state with a sign-in
 * prompt when there is no session (the guest list still shows locally).
 */
export default function Wishlist() {
  const { user, openAuth } = useAuth();
  const { items, toggle } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(items.length > 0);
  const [error, setError] = useState("");

  // stable sorting so a re-fetch is not triggered by pure order changes
  const itemsKey = useMemo(() => [...items].sort().join(","), [items]);

  useEffect(() => {
    if (!user) {
      // guest wishlist: fetch product data for the locally saved ids
      if (!items.length) {
        setProducts([]);
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      Promise.all(
        items.map((id) =>
          api
            .get(`/products/${id}`)
            .then((res) => res.data)
            .catch(() => null)
        )
      ).then((results) => {
        if (!active) return;
        setProducts(results.filter(Boolean));
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    if (!items.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    wishlistApi
      .get()
      .then((response) => {
        if (active) setProducts((response.data?.items || []).map((item) => item.product).filter(Boolean));
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Your wishlist could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, itemsKey]);

  useEffect(() => {
    document.title = "My wishlist | CARTIVO";
  }, []);

  async function handleSignOut() {
    try {
      await authApi.logout();
    } finally {
      window.location.reload();
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 lg:px-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-6 py-24 text-center">
        <Heart className="h-10 w-10 text-[var(--color-faint)]" aria-hidden="true" />
        <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">Wishlist</h1>
        <p className="text-sm text-[var(--color-muted)]">{error}</p>
      </div>
    );
  }

  if (!products.length) {
    const signedOut = !user;
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
        <Heart className="h-10 w-10 text-[var(--color-faint)]" aria-hidden="true" />
        <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
          {signedOut && items.length ? "Your saved items" : "Your wishlist is empty"}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {signedOut
            ? "Sign in to keep your wishlist synced across devices."
            : "Tap the heart on any product to save it here for later."}
        </p>
        {signedOut ? (
          <button
            type="button"
            onClick={() => openAuth(null, "login")}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
          >
            Sign in
          </button>
        ) : (
          <Link
            to="/products"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" /> Browse products
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-primary-bright)]">
            Saved for later
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
            My wishlist
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {products.length} {products.length === 1 ? "item" : "items"}
            {user ? " · synced to your account" : " · saved on this device only"}
          </p>
        </div>
        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
          >
            Sign out
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuth(null, "login")}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-primary-bright)] hover:text-[var(--color-primary-bright)]"
          >
            Sign in to sync
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <article
            key={product._id}
            className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-all hover:shadow-lg"
          >
            <Link to={"/products/" + product.slug} className="block aspect-square overflow-hidden bg-[var(--color-surface)] p-3">
              <ProductImage
                src={product.images?.[0]}
                alt={product.name}
                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
                width="512"
                height="512"
              />
            </Link>
            <button
              type="button"
              onClick={() => toggle(product._id)}
              aria-label={`Remove ${product.name} from wishlist`}
              className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition hover:bg-rose-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
              <Link
                to={"/products/" + product.slug}
                className="line-clamp-2 text-xs font-semibold leading-5 text-[var(--color-ink)] hover:text-[var(--color-primary-bright)] sm:text-sm"
              >
                {product.name}
              </Link>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">
                  {formatPrice(product.finalPrice || product.price)}
                </span>
                {Number(product.stock || 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => addItem(product._id, 1)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-bright)]"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                    Add to cart
                  </button>
                ) : (
                  <span className="text-xs font-medium text-[var(--color-faint)]">Out of stock</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
