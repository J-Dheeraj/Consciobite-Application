// Determine the API base URL at runtime so it works regardless of
// whether the build-time env var was injected correctly.
function getApiBase() {
  // 1. Runtime detection FIRST (most reliable for Render deployments)
  //    Derive API hostname from current page hostname
  //    e.g. consciobite-app.onrender.com -> consciobite-api.onrender.com
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname.endsWith(".onrender.com")) {
      const apiHost = hostname.replace("-app", "-api");
      return `${protocol}//${apiHost}/api`;
    }
  }

  // 2. Build-time env var (only if it looks like a valid full hostname)
  const envHost = process.env.REACT_APP_API_URL;
  if (envHost && envHost.includes(".")) {
    const base = envHost.startsWith("http") ? envHost : `https://${envHost}`;
    return `${base.replace(/\/$/, "")}/api`;
  }

  // 3. Local development fallback
  return "http://localhost:4000/api";
}

const API_BASE = getApiBase();

async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchProducts({ search, category, sort, page, limit } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  return safeFetch(`${API_BASE}/products?${params}`);
}

export async function fetchProduct(id) {
  return safeFetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
}

export async function scanBarcode(barcode) {
  return safeFetch(`${API_BASE}/products/scan/${encodeURIComponent(barcode)}`);
}

export async function compareProducts(ids) {
  return safeFetch(`${API_BASE}/products/compare?ids=${ids.map(encodeURIComponent).join(",")}`);
}

export async function fetchStats() {
  return safeFetch(`${API_BASE}/products/stats`);
}

export async function fetchRecommendations(id) {
  return safeFetch(`${API_BASE}/products/${encodeURIComponent(id)}/recommendations`);
}
