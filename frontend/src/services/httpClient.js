import { AUTH_EXPIRED_EVENT } from "../utils/constants";

function getApiBase() {
  // Explicit configuration wins: set NEXT_PUBLIC_API_URL at build time
  // (render.yaml wires it from the API service host).
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    const base = configured.startsWith("http") ? configured : `https://${configured}`;
    return `${base.replace(/\/$/, "")}/api`;
  }
  // Fallback: infer the API host from Render's -app/-api naming convention.
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname.endsWith(".onrender.com")) {
      const apiHost = hostname.replace("-app", "-api");
      return `${protocol}//${apiHost}/api`;
    }
  }
  return "/api";
}

const API_BASE = getApiBase();

let csrfToken = null;

// Access token lives in memory only — never in localStorage — so XSS cannot
// read a persisted copy. AuthContext calls setAuthToken on login/refresh/
// logout; session restore across reloads uses the httpOnly refresh cookie.
let inMemoryToken = null;

export function setAuthToken(token) {
  inMemoryToken = token;
}

function getAuthHeaders() {
  return inMemoryToken ? { Authorization: `Bearer ${inMemoryToken}` } : {};
}

async function ensureCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
    }
  } catch {
    // CSRF fetch failed — proceed without (non-critical for dev)
  }
  return csrfToken;
}

export async function httpClient(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
  }

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      if (body.error && body.error.includes("CSRF")) {
        csrfToken = null;
        const retryToken = await ensureCsrfToken();
        if (retryToken) {
          headers["X-CSRF-Token"] = retryToken;
          const retryRes = await fetch(url, { ...options, credentials: "include", headers });
          if (retryRes.ok) return retryRes.json();
        }
      }
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    if (res.status === 401 && typeof window !== "undefined" && inMemoryToken) {
      inMemoryToken = null;
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export { API_BASE };
