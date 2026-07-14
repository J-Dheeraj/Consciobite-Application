import { httpClient, API_BASE } from "./httpClient";

export async function fetchProductPassport(productId) {
  return httpClient(`${API_BASE}/v1/passport/${encodeURIComponent(productId)}`);
}

export async function scorePortfolio(productIds) {
  return httpClient(`${API_BASE}/v1/portfolio/score`, {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds }),
  });
}

export async function fetchProductAudit(productId, { limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString();
  return httpClient(
    `${API_BASE}/v1/audit/${encodeURIComponent(productId)}${qs ? `?${qs}` : ""}`
  );
}
