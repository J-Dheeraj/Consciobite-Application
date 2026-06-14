import { httpClient, API_BASE } from "./httpClient";

const V1 = `${API_BASE}/v1`;

export async function fetchPassport(productId) {
  return httpClient(`${V1}/passport/${encodeURIComponent(productId)}`);
}

export async function scorePortfolio(productIds) {
  return httpClient(`${V1}/portfolio/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_ids: productIds }),
  });
}

export async function fetchAuditLog(productId, { limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString() ? `?${params}` : "";
  return httpClient(`${V1}/audit/${encodeURIComponent(productId)}${qs}`);
}
