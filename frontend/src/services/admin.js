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

export async function fetchPendingScores({ limit = 100, offset = 0 } = {}) {
  return httpClient(`${API_BASE}/admin/pending-scores?limit=${limit}&offset=${offset}`);
}

export async function triggerStagedRescore(reason) {
  return httpClient(`${API_BASE}/admin/rescore?mode=stage`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function publishPendingScore(id, notes) {
  return httpClient(`${API_BASE}/admin/pending-scores/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function rejectPendingScore(id, notes) {
  return httpClient(`${API_BASE}/admin/pending-scores/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}
