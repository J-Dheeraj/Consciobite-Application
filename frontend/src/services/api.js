const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

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
