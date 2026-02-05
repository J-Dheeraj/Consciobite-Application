// Render's fromService host property returns the hostname (e.g., consciobite-api.onrender.com)
// In development, fall back to localhost
const HOST = process.env.REACT_APP_API_URL;
const BASE_URL = HOST
  ? HOST.startsWith("http") ? HOST : `https://${HOST}`
  : "http://localhost:4000";
const API_BASE = `${BASE_URL.replace(/\/$/, "")}/api`;

export async function fetchProducts({ search, category, sort } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  const res = await fetch(`${API_BASE}/products?${params}`);
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  return res.json();
}

export async function scanBarcode(barcode) {
  const res = await fetch(`${API_BASE}/products/scan/${barcode}`);
  return res.json();
}
