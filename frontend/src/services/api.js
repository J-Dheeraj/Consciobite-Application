/* eslint-disable no-undef */
// Determine the API base URL at runtime
function getApiBase() {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname.endsWith(".onrender.com")) {
      const apiHost = hostname.replace("-app", "-api");
      return `${protocol}//${apiHost}/api`;
    }
  }

  const envHost = process.env.REACT_APP_API_URL;
  if (envHost && envHost.includes(".")) {
    const base = envHost.startsWith("http") ? envHost : `https://${envHost}`;
    return `${base.replace(/\/$/, "")}/api`;
  }

  return "http://localhost:4000/api";
}

const API_BASE = getApiBase();

function getAuthHeaders() {
  const token = localStorage.getItem("consciobite_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ---- Products ----
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

// ---- Auth ----
export async function registerUser(name, email, password) {
  return safeFetch(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser(email, password) {
  return safeFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser() {
  return safeFetch(`${API_BASE}/auth/me`);
}

// ---- Reviews ----
export async function fetchReviews(productId) {
  return safeFetch(`${API_BASE}/reviews/${encodeURIComponent(productId)}`);
}

export async function submitReview(productId, rating, comment) {
  return safeFetch(`${API_BASE}/reviews/${encodeURIComponent(productId)}`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}

export async function deleteReview(reviewId) {
  return safeFetch(`${API_BASE}/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });
}

// ---- Carbon Tracker ----
export async function fetchCarbonSummary() {
  return safeFetch(`${API_BASE}/carbon/summary`);
}

export async function fetchCarbonLogs(page = 1) {
  return safeFetch(`${API_BASE}/carbon/logs?page=${page}`);
}

export async function logCarbonPurchase(productId, productName, quantity, emissions) {
  return safeFetch(`${API_BASE}/carbon/log`, {
    method: "POST",
    body: JSON.stringify({ productId, productName, quantity, emissions }),
  });
}

export async function deleteCarbonLog(id) {
  return safeFetch(`${API_BASE}/carbon/log/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---- Recipes ----
export async function fetchRecipes(tag) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  return safeFetch(`${API_BASE}/recipes?${params}`);
}

export async function fetchRecipe(id) {
  return safeFetch(`${API_BASE}/recipes/${encodeURIComponent(id)}`);
}

// ---- Methodology ----
export async function fetchMethodology() {
  return safeFetch(`${API_BASE}/methodology`);
}
