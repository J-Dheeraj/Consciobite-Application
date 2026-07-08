import { API_BASE } from "./httpClient";

export async function fetchProductPassport(productId) {
  const res = await fetch(`${API_BASE}/v1/passport/${productId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to fetch passport (${res.status})`);
  }
  return res.json();
}

export function downloadPassportJson(passport, productName) {
  const slug = (productName || "product").replace(/\s+/g, "-").toLowerCase();
  const blob = new Blob([JSON.stringify(passport, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consciobite-passport-${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
