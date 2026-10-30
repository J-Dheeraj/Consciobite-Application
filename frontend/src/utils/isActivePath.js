/**
 * Compare a nav target against the current pathname.
 *
 * `trailingSlash: true` makes usePathname() return "/products/", while nav
 * targets are written as "/products", so a direct === never matched and no
 * nav item was ever marked current. Normalize both sides before comparing.
 */
export function isActivePath(pathname, target) {
  if (!pathname || !target) return false;
  const strip = (p) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  return strip(pathname) === strip(target);
}
