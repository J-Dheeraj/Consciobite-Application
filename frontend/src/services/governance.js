import { httpClient, API_BASE } from "./httpClient";

export async function fetchTransparency() {
  return httpClient(`${API_BASE}/transparency`);
}
