import { httpClient, API_BASE } from "./httpClient";

export async function fetchRecipes(tag) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  return httpClient(`${API_BASE}/recipes?${params}`);
}

export async function fetchRecipe(id) {
  return httpClient(`${API_BASE}/recipes/${encodeURIComponent(id)}`);
}

export async function fetchMethodology() {
  return httpClient(`${API_BASE}/methodology`);
}
