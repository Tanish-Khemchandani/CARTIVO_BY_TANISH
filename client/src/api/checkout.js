import { api } from "./client";

// Quote the server-side price for a cart. The server re-fetches the actual
// product prices from the DB; nothing from local state is trusted.
export function quoteCart(items) {
  return api.post("/orders/quote", { items });
}

// Place a guest COD order.
export function placeOrder({ items, shippingAddress }) {
  return api.post("/orders", { items, shippingAddress, paymentMethod: "COD" });
}
