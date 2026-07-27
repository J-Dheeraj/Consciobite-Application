import { httpClient, API_BASE } from "./httpClient";

export async function listFavorites() {
  return httpClient(`${API_BASE}/favorites`);
}

export async function addFavorite(productId) {
  return httpClient(`${API_BASE}/favorites/${encodeURIComponent(productId)}`, {
    method: "POST",
  });
}

export async function removeFavorite(productId) {
  return httpClient(`${API_BASE}/favorites/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}
