import { httpClient, API_BASE } from "./httpClient";

export async function fetchFavoriteIds() {
  const data = await httpClient(`${API_BASE}/favorites`);
  return data.favoriteIds;
}

export async function toggleServerFavorite(productId) {
  return httpClient(`${API_BASE}/favorites/${productId}`, { method: "POST" });
}

export async function clearServerFavorites() {
  return httpClient(`${API_BASE}/favorites`, { method: "DELETE" });
}
