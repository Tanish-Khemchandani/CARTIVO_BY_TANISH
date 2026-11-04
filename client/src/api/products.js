import { api } from "./client";

export function getFeaturedProducts() {
  return api.get("/products/featured");
}

export function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/products${query ? `?${query}` : ""}`);
}

export function getProductBySlug(slug) {
  return api.get(`/products/${slug}`);
}

export function getProductReviews(productId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return api.get(`/products/${productId}/reviews${query ? `?${query}` : ""}`);
}

export function submitProductReview(productId, review) {
  return api.post(`/products/${productId}/reviews`, review);
}
