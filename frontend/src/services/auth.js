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

export async function updateProfile(name) {
  return httpClient(`${API_BASE}/auth/profile`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function changePassword(currentPassword, newPassword) {
  return httpClient(`${API_BASE}/auth/password`, {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function fetchUserStats() {
  return httpClient(`${API_BASE}/auth/stats`);
}
