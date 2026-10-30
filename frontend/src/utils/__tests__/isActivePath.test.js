import { isActivePath } from "../isActivePath";

describe("isActivePath", () => {
  // The bug: trailingSlash:true makes usePathname() return "/products/",
  // while NAV_LINKS targets are written "/products", so === never matched.
  test("matches a slashed pathname against a slashless target", () => {
    expect(isActivePath("/products/", "/products")).toBe(true);
  });

  test("matches when both sides agree", () => {
    expect(isActivePath("/products/", "/products/")).toBe(true);
    expect(isActivePath("/products", "/products")).toBe(true);
  });

  test("does not match a different route", () => {
    expect(isActivePath("/products/", "/compare")).toBe(false);
  });

  test("does not treat a prefix as a match", () => {
    expect(isActivePath("/product/1/", "/products")).toBe(false);
  });

  test("handles root without collapsing it to empty", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/", "/products")).toBe(false);
  });

  test("is safe with missing values", () => {
    expect(isActivePath(null, "/products")).toBe(false);
    expect(isActivePath("/products/", undefined)).toBe(false);
  });
});
