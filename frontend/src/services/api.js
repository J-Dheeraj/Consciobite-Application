// Determine the API base URL at runtime so it works regardless of
// whether the build-time env var was injected correctly.
function getApiBase() {
  // 1. Build-time env var (set by Render fromService or .env)
  const envHost = process.env.REACT_APP_API_URL;
  if (envHost) {
    const base = envHost.startsWith("http") ? envHost : `https://${envHost}`;
    return `${base.replace(/\/$/, "")}/api`;
  }

  // 2. Runtime detection: derive API hostname from current page hostname
  //    e.g. consciobite-app.onrender.com → consciobite-api.onrender.com
  const { hostname, protocol } = window.location;
  if (hostname.endsWith(".onrender.com")) {
    const apiHost = hostname.replace("-app", "-api");
    return `${protocol}//${apiHost}/api`;
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

export async function fetchProducts({ search, category, sort } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  return safeFetch(`${API_BASE}/products?${params}`);
}

export async function fetchProduct(id) {
  return safeFetch(`${API_BASE}/products/${encodeURIComponent(id)}`);
}

export async function scanBarcode(barcode) {
  return safeFetch(`${API_BASE}/products/scan/${encodeURIComponent(barcode)}`);
}
