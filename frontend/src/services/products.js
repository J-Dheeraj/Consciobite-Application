import { httpClient, API_BASE } from "./httpClient";

export async function fetchProducts({ search, category, sort, page, limit } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  return httpClient(`${API_BASE}/products?${params}`);
}

export async function fetchProduct(id) {
  return httpClient(`${API_BASE}/products/${encodeURIComponent(id)}`);
}

export async function scanBarcode(barcode) {
  return httpClient(`${API_BASE}/products/scan/${encodeURIComponent(barcode)}`);
}

export async function compareProducts(ids) {
  return httpClient(`${API_BASE}/products/compare?ids=${ids.map(encodeURIComponent).join(",")}`);
}

export async function fetchStats() {
  return httpClient(`${API_BASE}/products/stats`);
}

export async function fetchRecommendations(id) {
  return httpClient(`${API_BASE}/products/${encodeURIComponent(id)}/recommendations`);
}

export async function fetchProductAudit(id, { limit = 20, offset = 0 } = {}) {
  return httpClient(
    `${API_BASE}/v1/audit/${encodeURIComponent(id)}?limit=${limit}&offset=${offset}`
  );
}

export async function fetchPassport(id) {
  return httpClient(`${API_BASE}/v1/passport/${encodeURIComponent(id)}`);
}
