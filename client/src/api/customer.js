// customer auth + wishlist API calls; kept in one place like the other api modules
import { api } from "./client";

export const authApi = {
  me: () => api.get("/customer/auth/me"),
  login: (credentials) => api.post("/customer/auth/login", credentials),
  register: (details) => api.post("/customer/auth/register", details),
  logout: () => api.post("/customer/auth/logout", {}),
};

// the signed-in customer's own data: order history, profile edits and the
// saved address book. All of these need the customer session cookie.
export const accountApi = {
  orders: () => api.get("/orders/mine"),
  updateProfile: (details) => api.patch("/customer/auth/me", details),
  changePassword: (details) => api.patch("/customer/auth/password", details),
  addresses: () => api.get("/customer/addresses"),
  addAddress: (address) => api.post("/customer/addresses", address),
  updateAddress: (id, address) => api.patch(`/customer/addresses/${id}`, address),
  removeAddress: (id) => api.delete(`/customer/addresses/${id}`),
};

export const wishlistApi = {
  get: () => api.get("/wishlist"),
  add: (productId) => api.post(`/wishlist/${productId}`, {}),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};
