import { AUTH_EXPIRED_EVENT } from "@/utils/constants";

function getApiBase(): string {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname.endsWith(".onrender.com")) {
      const apiHost = hostname.replace("-app", "-api");
      return `${protocol}//${apiHost}/api`;
    }
  }
  const envHost = process.env.NEXT_PUBLIC_API_URL;
  if (envHost) {
    const base = envHost.startsWith("http") ? envHost : `https://${envHost}`;
    return `${base.replace(/\/$/, "")}/api`;
  }
  return "http://localhost:4000/api";
}

const API_BASE = getApiBase();

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("consciobite_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== "undefined" &&
      localStorage.getItem("consciobite_token")
    ) {
      localStorage.removeItem("consciobite_token");
      localStorage.removeItem("consciobite_user");
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ── Products ────────────────────────────────────────────────────────────────

interface ProductQueryParams {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function fetchProducts(params: ProductQueryParams = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category) q.set("category", params.category);
  if (params.sort) q.set("sort", params.sort);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  return safeFetch<unknown>(`${API_BASE}/products?${q}`);
}

export const fetchProduct = (id: string) =>
  safeFetch<unknown>(`${API_BASE}/products/${encodeURIComponent(id)}`);

export const scanBarcode = (barcode: string) =>
  safeFetch<unknown>(`${API_BASE}/products/scan/${encodeURIComponent(barcode)}`);

export const compareProducts = (ids: string[]) =>
  safeFetch<unknown>(`${API_BASE}/products/compare?ids=${ids.map(encodeURIComponent).join(",")}`);

export const fetchStats = () => safeFetch<unknown>(`${API_BASE}/products/stats`);

export const fetchRecommendations = (id: string) =>
  safeFetch<unknown>(`${API_BASE}/products/${encodeURIComponent(id)}/recommendations`);

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = (name: string, email: string, password: string) =>
  safeFetch<unknown>(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const loginUser = (email: string, password: string) =>
  safeFetch<unknown>(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const fetchCurrentUser = () => safeFetch<unknown>(`${API_BASE}/auth/me`);

// ── Reviews ──────────────────────────────────────────────────────────────────

export const fetchReviews = (productId: string) =>
  safeFetch<unknown>(`${API_BASE}/reviews/${encodeURIComponent(productId)}`);

export const submitReview = (productId: string, rating: number, comment: string) =>
  safeFetch<unknown>(`${API_BASE}/reviews/${encodeURIComponent(productId)}`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });

export const deleteReview = (reviewId: string) =>
  safeFetch<unknown>(`${API_BASE}/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });

// ── Carbon Tracker ───────────────────────────────────────────────────────────

export const fetchCarbonSummary = () => safeFetch<unknown>(`${API_BASE}/carbon/summary`);

export const fetchCarbonLogs = (page = 1) =>
  safeFetch<unknown>(`${API_BASE}/carbon/logs?page=${page}`);

export const logCarbonPurchase = (
  productId: string,
  productName: string,
  quantity: number,
  emissions: number
) =>
  safeFetch<unknown>(`${API_BASE}/carbon/log`, {
    method: "POST",
    body: JSON.stringify({ productId, productName, quantity, emissions }),
  });

export const deleteCarbonLog = (id: string) =>
  safeFetch<unknown>(`${API_BASE}/carbon/log/${encodeURIComponent(id)}`, { method: "DELETE" });

// ── Recipes ──────────────────────────────────────────────────────────────────

export const fetchRecipes = (tag?: string) => {
  const q = new URLSearchParams();
  if (tag) q.set("tag", tag);
  return safeFetch<unknown>(`${API_BASE}/recipes?${q}`);
};

export const fetchRecipe = (id: string) =>
  safeFetch<unknown>(`${API_BASE}/recipes/${encodeURIComponent(id)}`);

// ── Methodology ──────────────────────────────────────────────────────────────

export const fetchMethodology = () => safeFetch<unknown>(`${API_BASE}/methodology`);
