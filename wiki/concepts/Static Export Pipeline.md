---
type: concept
title: "Static Export Pipeline"
created: 2026-05-13
updated: 2026-05-13
status: developing
tags: [next.js, static-export, build, deployment]
related: ["[[Render Deployment]]", "[[Docker Build Context]]", "[[System Overview]]"]
---

# Static Export Pipeline

Next.js 14 with `output: 'export'` generates a fully static site. No Node.js server required at runtime.

## Configuration

**next.config.js:**
```javascript
const nextConfig = {
  output: "export",
  reactStrictMode: true,
};
```

**Build script** (`frontend/package.json`):
```
"build": "next build && rm -rf build && mv out build"
```

Next.js exports to `out/` by default; the script renames to `build/` for Render compatibility. The `rm -rf build` prevents `mv` from nesting `out/` inside an existing `build/` directory.

## Dynamic Routes

Static export requires `generateStaticParams()` for all dynamic routes. The app has one: `/product/[id]`.

**Problem:** `"use client"` pages cannot export `generateStaticParams()` (server-only API).

**Solution:** Split into two files:
- `page.js` — Server component wrapper, exports `generateStaticParams()` and renders `<ProductDetailClient />`
- `ProductDetailClient.js` — `"use client"` component with full product UI, uses `useParams()` for the ID

**Data source:** `generateStaticParams()` reads `backend/src/data/products.json` via `fs.readFileSync()` at build time. Returns 550 product ID objects. Falls back to `[]` on error (e.g., file not found in Docker context before the build-context fix).

## Incompatibilities with Static Export

These features are NOT available with `output: 'export'`:
- `next.config.js` `rewrites()` / `redirects()` — API proxying must be handled client-side (`getApiBase()` in httpClient.js)
- `export const dynamic = "force-dynamic"` in layouts — removed from all layout files
- Server-side rendering / ISR — all pages are fully static
- API routes (`app/api/`) — not generated in static export

## Output

The build produces ~566 static HTML files:
- 16 top-level routes (/, /about, /carbon, /dashboard, etc.)
- 550 product detail pages (/product/1 through /product/550)
- Served by nginx (Docker) or Render Static Site
