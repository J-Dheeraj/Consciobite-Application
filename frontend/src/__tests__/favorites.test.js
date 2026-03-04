import { getFavoriteIds, isFavorited, toggleFavorite, clearFavorites } from "../utils/favorites";

beforeEach(() => {
  localStorage.clear();
});

describe("getFavoriteIds", () => {
  test("returns empty array when nothing stored", () => {
    expect(getFavoriteIds()).toEqual([]);
  });

  test("returns stored ids", () => {
    localStorage.setItem("consciobite_favorites", JSON.stringify(["a", "b"]));
    expect(getFavoriteIds()).toEqual(["a", "b"]);
  });

  test("returns empty array for corrupt JSON", () => {
    localStorage.setItem("consciobite_favorites", "not-json");
    expect(getFavoriteIds()).toEqual([]);
  });
});

describe("isFavorited", () => {
  test("returns false when no favorites exist", () => {
    expect(isFavorited("abc")).toBe(false);
  });

  test("returns true for a stored id", () => {
    localStorage.setItem("consciobite_favorites", JSON.stringify(["abc"]));
    expect(isFavorited("abc")).toBe(true);
  });
});

describe("toggleFavorite", () => {
  test("adds id when not favorited", () => {
    const result = toggleFavorite("item-1");
    expect(result).toBe(true);
    expect(getFavoriteIds()).toContain("item-1");
  });

  test("removes id when already favorited", () => {
    localStorage.setItem("consciobite_favorites", JSON.stringify(["item-1"]));
    const result = toggleFavorite("item-1");
    expect(result).toBe(false);
    expect(getFavoriteIds()).not.toContain("item-1");
  });

  test("dispatches favorites-updated event", () => {
    const handler = jest.fn();
    window.addEventListener("favorites-updated", handler);
    toggleFavorite("item-1");
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("favorites-updated", handler);
  });
});

describe("clearFavorites", () => {
  test("removes all favorites", () => {
    localStorage.setItem("consciobite_favorites", JSON.stringify(["a", "b", "c"]));
    clearFavorites();
    expect(getFavoriteIds()).toEqual([]);
  });
});
