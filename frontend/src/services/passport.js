import { httpClient, API_BASE } from "./httpClient";

const V1 = `${API_BASE}/v1`;

export async function fetchProductPassport(productId) {
  return httpClient(`${V1}/passport/${encodeURIComponent(productId)}`);
}

export async function scorePortfolio(productIds) {
  return httpClient(`${V1}/portfolio/score`, {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
}

export async function fetchAuditLog(productId, { limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return httpClient(`${V1}/audit/${encodeURIComponent(productId)}?${params}`);
}
