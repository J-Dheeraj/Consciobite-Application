import { httpClient, API_BASE } from "./httpClient";

export async function fetchConflictLog(filter) {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("filter", filter);
  const query = params.toString();
  return httpClient(`${API_BASE}/admin/conflict-log${query ? `?${query}` : ""}`);
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

export async function fetchPendingEvidence({ limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  const query = params.toString();
  return httpClient(`${API_BASE}/admin/pending-evidence${query ? `?${query}` : ""}`);
}

export async function reviewEvidence(id, { status, notes } = {}) {
  return httpClient(`${API_BASE}/admin/evidence/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ status, ...(notes ? { notes } : {}) }),
  });
}
