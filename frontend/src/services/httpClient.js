const API_BASE = "/api";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("consciobite_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function httpClient(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && localStorage.getItem("consciobite_token")) {
      localStorage.removeItem("consciobite_token");
      localStorage.removeItem("consciobite_user");
      window.dispatchEvent(new Event("auth-expired"));
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export { API_BASE };
