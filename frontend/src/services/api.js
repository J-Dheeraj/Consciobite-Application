// Render's fromService host property returns the hostname (e.g., consciobite-api.onrender.com)
// In development, fall back to localhost
const HOST = process.env.REACT_APP_API_URL;
const BASE_URL = HOST
  ? HOST.startsWith("http") ? HOST : `https://${HOST}`
  : "http://localhost:4000";
const API_BASE = `${BASE_URL.replace(/\/$/, "")}/api`;

async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchProducts({ search, category, sort } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  return safeFetch(`${API_BASE}/products?${params}`);
}

export async function fetchProduct(id) {
  return safeFetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
}

export async function scanBarcode(barcode) {
  return safeFetch(`${API_BASE}/products/scan/${encodeURIComponent(barcode)}`);
}
