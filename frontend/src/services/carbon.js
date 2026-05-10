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
