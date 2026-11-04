import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../api/customer";

/*
 * Storefront auth. Session state is checked once on load; the actual
 * login/signup UI lives in AuthModal, which is the ONLY component that
 * opens itself — anything else that needs a signed-in user calls
 * openAuth(action) instead of navigating away, so the customer keeps
 * their place on the page (wishlist, checkout trigger, account, etc).
 */
const AuthContext = createContext(null);

export function AuthProvider({ children, modalSlot }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // what the modal should do after a successful sign-in; a ref because the
  // pending action must survive re-renders while the modal is open
  const pendingActionRef = useRef(null);
  const [modalState, setModalState] = useState({ open: false, mode: "login" });

  useEffect(() => {
    let active = true;
    authApi
      .me()
      .then((response) => {
        if (active) setUser(response.data);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openAuth = useCallback((action, mode = "login") => {
    pendingActionRef.current = action ? { ...action } : null;
    setModalState({ open: true, mode });
  }, []);

  const closeAuth = useCallback(() => {
    setModalState((state) => ({ ...state, open: false }));
    // keep the pending action for a beat? No: closing means "not now",
    // so drop it. A fresh trigger always sets a new one.
    pendingActionRef.current = null;
  }, []);

  const handleAuthenticated = useCallback(async (signedInUser) => {
    setUser(signedInUser);
    setModalState({ open: false, mode: "login" });
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) await action.onAuthenticated(signedInUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // re-reads the session, used after the profile page saves a change so
  // every component showing the name/email sees the new value
  const refresh = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.data);
      return response.data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, openAuth, logout, refresh }),
    [user, loading, openAuth, logout, refresh]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modalSlot
        ? modalState.open && modalSlot({ open: modalState.open, mode: modalState.mode, onClose: closeAuth, onAuthenticated: handleAuthenticated })
        : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

// helpers for the shapes of "things to do once signed in"
export const authActions = {
  goAccount: () => ({ onAuthenticated: () => { window.location.assign("/account"); } }),
};
