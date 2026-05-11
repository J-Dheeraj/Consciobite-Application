import { httpClient, API_BASE } from "./httpClient";

export async function fetchReviews(productId) {
  return httpClient(`${API_BASE}/reviews/${encodeURIComponent(productId)}`);
}

export async function submitReview(productId, rating, comment) {
  return httpClient(`${API_BASE}/reviews/${encodeURIComponent(productId)}`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}

export async function deleteReview(reviewId) {
  return httpClient(`${API_BASE}/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}
