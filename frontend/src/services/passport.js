import { httpClient, API_BASE } from "./httpClient";

export async function fetchPassport(productId) {
  return httpClient(`${API_BASE}/v1/passport/${encodeURIComponent(productId)}`);
}

export async function scorePortfolio(productIds) {
  return httpClient(`${API_BASE}/v1/portfolio/score`, {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
}

export async function fetchAuditLog(productId, { limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return httpClient(`${API_BASE}/v1/audit/${encodeURIComponent(productId)}?${params}`);
}
