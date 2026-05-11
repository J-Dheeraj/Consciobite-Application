import { httpClient, API_BASE } from "./httpClient";

export async function registerUser(name, email, password) {
  return httpClient(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser(email, password) {
  return httpClient(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCurrentUser() {
  return httpClient(`${API_BASE}/auth/me`);
}
