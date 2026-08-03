import { httpClient, getAuthHeaders, API_BASE } from "./httpClient";

export async function fetchProducts({ search, category, sort, page, limit } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  return httpClient(`${API_BASE}/products?${params}`);
}

export async function fetchProduct(id) {
  return httpClient(`${API_BASE}/products/${encodeURIComponent(id)}`);
}

export async function scanBarcode(barcode) {
  return httpClient(`${API_BASE}/products/scan/${encodeURIComponent(barcode)}`);
}

export async function compareProducts(ids) {
  return httpClient(`${API_BASE}/products/compare?ids=${ids.map(encodeURIComponent).join(",")}`);
}

export async function fetchStats() {
  return httpClient(`${API_BASE}/products/stats`);
}

export async function fetchRecommendations(id) {
  return httpClient(`${API_BASE}/products/${encodeURIComponent(id)}/recommendations`);
}

export async function fetchPassport(id) {
  return httpClient(`${API_BASE}/v1/passport/${encodeURIComponent(id)}`);
}

export async function fetchPortfolioScore(ids) {
  return httpClient(`${API_BASE}/v1/portfolio/score`, {
    method: "POST",
    body: JSON.stringify({ product_ids: ids }),
  });
}

export async function fetchAuditLog(id, { limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return httpClient(`${API_BASE}/v1/audit/${encodeURIComponent(id)}?${params}`);
}

export async function fetchProductEvidence(id) {
  return httpClient(`${API_BASE}/products/${encodeURIComponent(id)}/evidence`);
}

export async function submitProductEvidence(id, data) {
  return httpClient(`${API_BASE}/products/${encodeURIComponent(id)}/evidence`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Export a portfolio report in JSON or CSV format.
// For CSV: triggers a browser download and returns null.
// For JSON: returns the parsed report object.
export async function exportPortfolioReport({ productIds, format = "json", reportTitle } = {}) {
  const res = await fetch(`${API_BASE}/v1/portfolio/export`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      product_ids: productIds,
      format,
      ...(reportTitle ? { report_title: reportTitle } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Export failed (${res.status})`);
  }

  if (format === "csv") {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `portfolio-report-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return null;
  }

  return res.json();
}
