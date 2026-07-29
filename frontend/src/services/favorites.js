import { httpClient, API_BASE } from "./httpClient";

export async function fetchFavorites() {
  return httpClient(`${API_BASE}/favorites`);
}

export async function addFavorite(productId) {
  return httpClient(`${API_BASE}/favorites`, {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeFavorite(productId) {
  return httpClient(`${API_BASE}/favorites/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function clearServerFavorites() {
  return httpClient(`${API_BASE}/favorites/all`, {
    method: "DELETE",
  });
}
