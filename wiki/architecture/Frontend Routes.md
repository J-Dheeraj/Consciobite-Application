# Frontend Routes

All routes use Next.js App Router with file-based routing in `src/app/`.

## Route Map

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.js` | Landing page with hero, search, value props |
| `/products` | `products/page.js` | Product catalog with filters and sorting |
| `/product/[id]` | `product/[id]/page.js` | Product detail with [[GreenGrade]] breakdown |
| `/scan` | `scan/page.js` | Barcode scanner (camera + manual entry) |
| `/compare` | `compare/page.js` | Side-by-side product comparison |
| `/dashboard` | `dashboard/page.js` | Analytics dashboard with charts |
| `/carbon` | `carbon/page.js` | Personal carbon footprint tracker |
| `/favorites` | `favorites/page.js` | Saved products (localStorage) |
| `/recipes` | `recipes/page.js` | Eco-friendly recipe suggestions |
| `/tips` | `tips/page.js` | Sustainability tips |
| `/about` | `about/page.js` | About page |
| `/methodology` | `methodology/page.js` | Scoring methodology explanation |
| `/login` | `login/page.js` | User login |
| `/register` | `register/page.js` | User registration |
| `/transparency` | `transparency/page.js` | Public governance page — panel seats, commitments, live score-change stats |
| `/admin/conflict-log` | `admin/conflict-log/page.js` | Admin-only audit table, filters, rescore button |
| `/admin/manufacturers` | `admin/manufacturers/page.js` | Admin-only manufacturer onboarding + product linking |

## Shared Layout

`layout.js` wraps all routes with:
- [[Providers]] (QueryClient + ThemeProvider + AuthProvider + [[ApiReadyGate Component]] for Render cold-start UX)
- [[Navbar]] (sticky top nav with desktop/mobile views)
- [[Footer]] (site footer with links)
- [[BottomNav]] (mobile bottom navigation, visible < 768px)

## Key Patterns
- All page components use `"use client"` directive
- Import paths use `@/` alias (maps to `./src/`)
- Navigation via `useRouter()` from `next/navigation`
- Links use `next/link` with `href` prop
