---
type: meta
title: "Hot Cache"
created: 2026-04-25
updated: 2026-04-25
status: evergreen
tags: [hot-cache, meta]
---

# Hot Cache

~500-word recent-context summary. Updated after every ingest or major query.

---

**Last updated:** 2026-04-26

**Session start protocol:** Run `/graphify` first (fresh knowledge graph), then read this file. Both are required — graph catches structural drift, wiki persists decisions.

**Prettier invariant (learned 2026-04-26):** CI enforces Prettier formatting. Audit fixes in commit 8d50d17 introduced formatting drift; CI failed on 5 files (backend: index.js, routes/carbon.js, routes/reviews.js — frontend: App.js, pages/CarbonTracker.js). Fixed in commit 6e01ca4. Rule: run `npx prettier --write` on every modified file before committing, verify with `--check`.

**Migration plan v2 (2026-04-26):** `MIGRATION_PLAN_V2.md` replaces the original brief. Principle: one architectural layer per session, app stays deployable after every session. Sessions: Pre-work (decisions + data) → S1 Data (SQLite → Supabase, backend only) → S2 Frontend (Next.js 14 + Tailwind, frontend only) → S3 Auth (JWT → Supabase Auth) → S4 API type safety (tRPC + Zod + Upstash) → S5 GreenGrade (JS optimise or Python rewrite, gated on pre-work decision).

**Inline style count correction:** 654 `style={{}}` instances across 20 files (previous figure of 499 was wrong). 15 pages, 12 components. 9 product categories.

**Project:** Consciobite — React 18 SPA + Node.js/Express API + SQLite. Food sustainability app. Rates grocery products A–F using GreenGrade (KDE + sigmoid scoring across 7 lifecycle emission dimensions). Features carbon tracker, barcode scanner (Open Food Facts fallback), recipe recommender, and review system.

**Audit summary (graphify, 2026-04-25):** Full-codebase analysis via AST + LLM semantic knowledge graph. 255 nodes, 45 communities, 23 findings. 2 findings fixed immediately (RequireAuth guard, validate() wiring). 19 additional findings fixed this session. 2 confirmed false positives.

**Key fixes landed:**
- CORS pattern now configurable via `ALLOWED_ORIGIN_PATTERN` env var
- `products.json` validated at startup against required schema (id, name, category, 7 emission keys)
- Async `GET /:id` and `GET /scan/:barcode` handlers wrapped in try/catch
- `validate()` middleware wired into all remaining routes: reviews (GET/POST/DELETE), recipes (GET/GET:id), carbon (GET /logs)
- `OPEN_FOOD_FACTS_TIMEOUT_MS` extracted as named constant
- `DEFAULT_PORT` extracted as named constant
- `AUTH_EXPIRED_EVENT` centralised in `src/utils/constants.js`; both `api.js` and `AuthContext.js` import it
- `WEEKLY_CARBON_GOAL_KG` constant added to shared constants
- 5 silent catch blocks replaced with visible error feedback (CarbonTracker delete, ReviewSection load+delete, ProductDetail log, Compare initial load)
- `aria-label` + `aria-expanded` added to expand/collapse buttons in Tips and Recipes; `aria-label` added to CarbonTracker delete button

**False positives confirmed:**
- B2: Cache only wraps public routes — no per-user data leak risk
- B4: `requireAuth` returns 401 in catch; `optionalAuth` continues without user — both intentional

**Current test status:** 95 backend + 44 frontend tests all passing.

**Architectural quirk worth remembering:** The `auth-expired` event bus is the invisible coupling between `safeFetch()` (api.js) and `AuthContext.js`. The graphify graph flagged it because AST cannot see event-name string equality across files; it looked like two unrelated nodes. Fixing it with a shared constant removes the hidden coupling.
