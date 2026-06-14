import { httpClient, API_BASE } from "./httpClient";

const V1 = `${API_BASE}/v1`;

export async function fetchPassport(productId) {
  return httpClient(`${V1}/passport/${encodeURIComponent(productId)}`);
}

export async function fetchPortfolioScore(productIds) {
  return httpClient(`${V1}/portfolio/score`, {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
}

export async function fetchProductAudit(productId, { limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));
  const query = params.toString() ? `?${params}` : "";
  return httpClient(`${V1}/audit/${encodeURIComponent(productId)}${query}`);
}
