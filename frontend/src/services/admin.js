import { httpClient, API_BASE } from "./httpClient";

export async function fetchConflictLog(filter, page = 0, limit = 50) {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("filter", filter);
  params.set("limit", String(limit));
  params.set("offset", String(page * limit));
  return httpClient(`${API_BASE}/admin/conflict-log?${params.toString()}`);
}

export async function triggerRescore() {
  return httpClient(`${API_BASE}/admin/rescore`, { method: "POST" });
}

export async function createManufacturer({ name, email, isPaying }) {
  return httpClient(`${API_BASE}/admin/manufacturers`, {
    method: "POST",
    body: JSON.stringify({ name, email, isPaying }),
  });
}

export async function fetchManufacturers() {
  return httpClient(`${API_BASE}/admin/manufacturers`);
}

export async function linkProductManufacturer({ productId, manufacturerId }) {
  return httpClient(`${API_BASE}/admin/product-manufacturer`, {
    method: "POST",
    body: JSON.stringify({ productId, manufacturerId }),
  });
}

export async function acknowledgeFee(manufacturerId) {
  return httpClient(`${API_BASE}/admin/manufacturers/${manufacturerId}/acknowledge-fee`, {
    method: "POST",
  });
}

export async function fetchTransparencyStats() {
  return httpClient(`${API_BASE}/transparency/stats`);
}
