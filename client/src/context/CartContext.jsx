import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const CART_KEY = "cartivo-cart";

// Guest cart lives in localStorage; it merges into an account cart later
// when real customer auth is built (Phase 3).
function readStoredCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.productId === "string" && Number.isInteger(item.quantity))
      .map((item) => ({ productId: item.productId, quantity: Math.min(99, Math.max(1, item.quantity)), selectedOptions: item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {} }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode): cart still works for this visit
    }
  }, [items]);

  const addItem = useCallback((productId, quantity = 1, selectedOptions = {}) => {
    const id = String(productId);
    const options = Object.fromEntries(Object.entries(selectedOptions).map(([key, value]) => [key, String(value)]));
    const sameOptions = (item) => JSON.stringify(item.selectedOptions || {}) === JSON.stringify(options);
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === id && sameOptions(item));
      if (existing) {
        return prev.map((item) => item === existing
          ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
          : item);
      }
      return [...prev, { productId: id, quantity: Math.min(99, Math.max(1, quantity)), selectedOptions: options }];
    });
  }, []);

  const matchesLine = (item, line) => typeof line === "object"
    ? item.productId === line.productId && JSON.stringify(item.selectedOptions || {}) === JSON.stringify(line.selectedOptions || {})
    : item.productId === line;

  const setQuantity = useCallback((line, quantity) => {
    const qty = Number(quantity);
    setItems((prev) => {
      if (!Number.isInteger(qty) || qty < 1) return prev.filter((item) => !matchesLine(item, line));
      return prev.map((item) => matchesLine(item, line) ? { ...item, quantity: Math.min(99, qty) } : item);
    });
  }, []);

  const removeItem = useCallback((line) => {
    setItems((prev) => prev.filter((item) => !matchesLine(item, line)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, addItem, setQuantity, removeItem, clearCart, count: items.reduce((sum, i) => sum + i.quantity, 0) }),
    [items, addItem, setQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
