export function getFavoriteIds() {
  try {
    return JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
  } catch {
    return [];
  }
}

export function isFavorited(id) {
  return getFavoriteIds().includes(id);
}

export function toggleFavorite(id) {
  try {
    const favs = getFavoriteIds();
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    localStorage.setItem("consciobite_favorites", JSON.stringify(next));
    window.dispatchEvent(new Event("favorites-updated"));
    return next.includes(id);
  } catch {
    return false;
  }
}

export function clearFavorites() {
  localStorage.setItem("consciobite_favorites", "[]");
  window.dispatchEvent(new Event("favorites-updated"));
}
