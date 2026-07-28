import { httpClient, API_BASE } from "./httpClient";

export async function fetchCarbonSummary() {
  return httpClient(`${API_BASE}/carbon/summary`);
}

export async function fetchCarbonLogs(page = 1) {
  return httpClient(`${API_BASE}/carbon/logs?page=${page}`);
}

export async function logCarbonPurchase(productId, productName, quantity, emissions) {
  return httpClient(`${API_BASE}/carbon/log`, {
    method: "POST",
    body: JSON.stringify({ productId, productName, quantity, emissions }),
  });
}

export async function deleteCarbonLog(id) {
  return httpClient(`${API_BASE}/carbon/log/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function downloadCarbonExport() {
  const token = typeof window !== "undefined" ? localStorage.getItem("consciobite_token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/carbon/export`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed (${res.status})`);
  }
  return res.blob();
}
