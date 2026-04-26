# Consciobite Migration Plan v2

_Written 2026-04-26. Replaces GREENGRADE_MIGRATION_BRIEF.md._

---

## What the Original Plan Got Wrong

| Error | Brief claimed | Actual |
|-------|--------------|--------|
| Scoring language | Python microservice | 536-line JavaScript (`greengrade.js`) |
| Styling system | Tailwind CSS | 654 inline `style={{}}` + BEM custom CSS |
| Product count | 576 | 550 |
| Water footprint data | Fields exist | `waterBlue/Green/Grey` do not exist in `products.json` |
| Products in database | SQLite table | JSON file only; SQLite has `users`, `reviews`, `carbon_logs` |

The original plan's Session 2 ("extract GreenGrade to Python") is a complete language
rewrite, not an extraction. Session 1's "product migration" is a seed-from-JSON
operation, not a database-to-database migration. Both were underscoped by roughly 3×.

---

## Principle: One Layer Per Session

The original plan changed frontend + backend + ML + database simultaneously in Session 1.
This plan changes one architectural layer per session. Every session ends with a
fully working, deployable app. No half-migrated states.

```
Session 1  →  Data layer      (backend only,  0 frontend changes)
Session 2  →  Frontend        (frontend only, 0 backend changes)
Session 3  →  Auth            (both layers,   small surface area)
Session 4  →  API type safety (both layers,   replaces REST + validate())
Session 5  →  GreenGrade      (backend only,  gated on pre-work decision)
```

---

## Pre-Work (Not a Session)

Do this before writing any migration code. Most of it is decisions and data, not code.

### P1 — GreenGrade: Keep JS or port to Python?

The current algorithm is a complete, tested 536-line JavaScript KDE implementation.
Arguments for keeping it in JavaScript:

- No cold-start penalty (in-process, not a network call)
- No second language in the stack
- No service-to-service auth to manage
- All 95 backend tests already cover it

Arguments for Python:

- scipy/numpy for future retraining or data science work
- Easier water footprint modelling with pandas

**Recommendation:** Keep JavaScript unless the team has a Python data science workflow
planned. This is a strategic decision, not a technical one. Document the choice and
the reasoning before Session 5 starts.

### P2 — Water footprint: in scope or out?

`waterBlue`, `waterGreen`, `waterGrey` do not exist anywhere in the codebase.
Sourcing credible per-category water footprint data (FAO, WaterFootprint.org) for all
550 products across 9 categories is a research task, not a coding task. Estimate: 1–2
weeks of data work.

**Options:**
- **Descope** — remove from this migration entirely; add later as a standalone feature
- **Phase** — start data collection now; gate Session 5 on data availability

There is no third option. Do not write the water footprint calculator before the data exists.

### P3 — Generate GreenGrade baseline fixtures

Before any code changes, run all 550 products through the current `greengrade.js` and
save the output as a JSON fixture file. This becomes the acceptance test for Session 5
if the algorithm is ever changed or ported.

```bash
cd backend
node -e "
const { enrichProduct } = require('./src/services/greengrade');
const products = require('./src/data/products.json');
const fs = require('fs');
const scores = products.map(p => ({ id: p.id, score: enrichProduct(p).score, grade: enrichProduct(p).color }));
fs.writeFileSync('./test/fixtures/greengrade-baseline.json', JSON.stringify(scores, null, 2));
"
```

### P4 — Audit inline styles

654 inline `style={{}}` instances across 20 files. Before Session 2, categorise them:

```bash
# Colour/theme values → Tailwind colour utilities
grep -r "style={{" frontend/src | grep -i "color\|background" | wc -l

# Spacing → Tailwind spacing utilities
grep -r "style={{" frontend/src | grep -i "margin\|padding\|gap" | wc -l

# Layout → Tailwind flex/grid utilities
grep -r "style={{" frontend/src | grep -i "display\|flex\|grid\|width\|height" | wc -l
```

This categorisation tells you how many Tailwind classes need custom config (brand colours)
vs. how many are covered by the default scale.

### P5 — Provision infrastructure

- Create Supabase project (free tier is fine to start)
- Create Upstash Redis instance
- Note connection strings — they'll be needed in Session 1 and Session 4 respectively
- Do not configure any code yet

---

## Session 1: Data Layer

**Goal:** The app runs on Supabase PostgreSQL with zero changes to the frontend or
auth system. SQLite is fully retired at the end of this session.

### Scope — what changes

**Supabase schema** (mirrors current SQLite exactly):

```sql
-- products (new — seeded from products.json)
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  barcode TEXT,
  description TEXT,
  emissions JSONB NOT NULL,
  data_sources JSONB,
  purchase_links JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- users (migrated from SQLite)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- reviews (migrated)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- carbon_logs (migrated)
CREATE TABLE carbon_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  emissions REAL NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now()
);
```

**Seed script** (`backend/scripts/seed-products.js`):
- Reads `products.json` (550 records)
- Upserts into Supabase `products` table
- Idempotent (safe to re-run)

**Replace `better-sqlite3`** with Supabase JS client (`@supabase/supabase-js`) in all
route files. The query shapes change; the route URLs, request bodies, and response
shapes do not.

**`validateProductCatalog()`** — keep the startup JSON check. Products are still read
from JSON for the GreenGrade model training; the Supabase table is for reviews and
carbon log foreign key integrity. Add a startup Supabase connectivity check alongside it.

**`DB_PATH` env var** → replaced by `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars.

### Scope — what does NOT change

- React frontend (zero changes)
- JWT auth (zero changes)
- Express routes (same URLs, same middleware, same response shapes)
- `validate()` middleware schemas (untouched)
- `AUTH_EXPIRED_EVENT` (untouched)
- `greengrade.js` (untouched)
- `products.json` (still used for model training — Supabase table is for relational data)

### Acceptance criteria

- [ ] All 95 backend tests pass against Supabase (update `DB_PATH` → Supabase test instance)
- [ ] All 44 frontend tests pass (frontend untouched)
- [ ] `POST /api/auth/register` → `POST /api/auth/login` → `GET /api/carbon/logs` works end-to-end
- [ ] SQLite file can be deleted with no effect

### Risks

| Risk | Mitigation |
|------|-----------|
| Supabase free tier cold-start on first query | Add connection warmup ping at startup |
| UUID vs TEXT id format change breaks existing tokens | Keep id as TEXT in Supabase or handle in auth middleware |
| Test suite depends on SQLite test fixtures | Create a Supabase test project; seed it in `beforeAll` |

---

## Session 2: Frontend

**Goal:** The app is a Next.js 14 App Router SPA calling the same Express API endpoints.
All 654 inline styles replaced with Tailwind. Zero backend changes.

### Scope — what changes

**Scaffold Next.js 14:**
```bash
npx create-next-app@latest frontend-next --typescript --tailwind --app --no-src-dir
```

**Tailwind config** — add brand colours from current CSS:
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      // Extract from frontend/src/index.css and Home.js lp-* classes
    }
  }
}
```

**Migrate pages** (one per PR, in order of complexity):
1. `NotFound.js` — simplest, no data fetching
2. `About.js`, `Methodology.js` — static content
3. `Login.js`, `Register.js` — forms, no auth context yet
4. `Home.js` — marketing page, BEM CSS → Tailwind (only page using custom CSS classes)
5. `Products.js`, `ProductDetail.js` — TanStack Query data fetching
6. `Scan.js`, `Compare.js`, `Favorites.js`
7. `CarbonTracker.js`, `Dashboard.js`
8. `Recipes.js`, `Tips.js`

**Components** (migrate alongside pages that use them):
- `Navbar`, `Footer`, `BottomNav` — migrate early (used everywhere)
- `GradeBadge`, `ProductCard`, `PageHero`, `Skeleton`, `Spinner` — migrate with parent pages
- `ReviewSection`, `GradeBreakdown`, `ErrorBoundary` — migrate last

**Routing:** React Router v6 → Next.js App Router file-based routing.
`<Link>` and `useNavigate` → Next.js `<Link>` and `useRouter`.

**Auth context:** Keep `AuthContext.js` and `AUTH_EXPIRED_EVENT` unchanged.
The JWT token handling does not change in this session.

**API calls:** All `safeFetch()` calls in `api.js` remain unchanged. The Express
backend URL is now an env var (`NEXT_PUBLIC_API_URL`).

**Run Prettier after every file** before committing:
```bash
cd frontend && npx prettier --write <file>
```

### Scope — what does NOT change

- Express backend (zero changes)
- JWT auth (zero changes)
- `api.js` / `safeFetch()` (zero changes)
- `AUTH_EXPIRED_EVENT` (zero changes)
- `WEEKLY_CARBON_GOAL_KG` (import path may change)
- GreenGrade algorithm

### Acceptance criteria

- [ ] All 15 pages render correctly in Next.js
- [ ] Zero `style={{}}` instances remaining in migrated files
- [ ] `npx prettier --check` passes on all files
- [ ] All 44 frontend tests ported and passing
- [ ] `next build` produces no errors or type errors

### Risks

| Risk | Mitigation |
|------|-----------|
| 654 style conversions introduce visual regressions | Screenshot each page before/after; review visually |
| TanStack Query SSR hydration mismatch | Use `'use client'` directive on data-fetching components initially |
| Home.js BEM classes have no direct Tailwind equivalent | Extract brand values to Tailwind config first |

---

## Session 3: Auth

**Goal:** JWT replaced by Supabase Auth. `AUTH_EXPIRED_EVENT` event bus retired.
Account lockout logic removed (Supabase handles it). Both layers touched, small surface.

### Scope — what changes

**Backend:**
- Replace `jsonwebtoken` with Supabase JWT verification (`supabase.auth.getUser(token)`)
- `requireAuth` middleware: verify Supabase JWT instead of custom JWT
- `optionalAuth` middleware: same change
- Remove `POST /api/auth/register` and `POST /api/auth/login` routes (Supabase handles signup/signin)
- Remove `failed_attempts` and `locked_until` columns from `users` table (or leave as dead columns)
- Remove `MAX_ATTEMPTS` and `LOCKOUT_MS` constants from `auth.js`

**Frontend:**
- Install `@supabase/supabase-js`
- Replace `AuthContext.js`:
  - Remove `AUTH_EXPIRED_EVENT` listener
  - Replace with `supabase.auth.onAuthStateChange`
  - Store Supabase session instead of JWT string
- Remove `AUTH_EXPIRED_EVENT` from `constants.js`
- Remove `AUTH_EXPIRED_EVENT` dispatch from `api.js` (401 handling now done by Supabase client)
- Update `Login.js` / `Register.js` to use `supabase.auth.signInWithPassword` / `signUp`

### Scope — what does NOT change

- All non-auth routes (products, reviews, carbon, recipes)
- `validate()` middleware schemas
- `greengrade.js`
- Tailwind styles from Session 2
- Next.js routing

### Acceptance criteria

- [ ] Register → login → protected route works end-to-end
- [ ] 401 on expired session triggers logout (via `onAuthStateChange`, not event bus)
- [ ] `AUTH_EXPIRED_EVENT` has zero remaining references (`grep -r "AUTH_EXPIRED" src` returns nothing)
- [ ] All tests pass

---

## Session 4: API Type Safety

**Goal:** All Express routes replaced by tRPC procedures with Zod schemas. Upstash Redis
added for caching. Full end-to-end TypeScript type safety.

### Scope — what changes

**tRPC router** (Next.js API route at `/api/trpc/[trpc]`):

Port each Express route file to a tRPC router. Each `validate()` schema becomes a Zod
schema on the tRPC procedure input.

Critical: query param integer coercion. Current `validate()` uses `pattern: /^\d+$/`
because Express gives query params as strings. In tRPC, use `z.coerce.number().int().positive()`.

```ts
// carbon router — paginated logs
getLogs: protectedProcedure
  .input(z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }))
  .query(async ({ input, ctx }) => { ... })
```

**Prisma schema** (over Supabase PostgreSQL from Session 1):
```prisma
model Product { id String @id ... emissions Json ... }
model Review  { id String @id ... rating Int ... }
model CarbonLog { id String @id ... emissions Float ... }
```

**Upstash Redis** (replaces node-cache):
- `/api/trpc/products.list` — 120 s TTL
- `/api/trpc/recipes.list` — 600 s TTL
- Cache key: procedure name + serialised input (public routes only)

**Remove Express** once all routes are ported. `backend/` folder becomes `server/` or
folds into Next.js `app/api/`.

### Scope — what does NOT change

- Supabase Auth (Session 3)
- Tailwind styles (Session 2)
- `greengrade.js` — still called from tRPC product procedures
- `products.json` — still used for model training

### Acceptance criteria

- [ ] All 9 former `validate()` endpoints have equivalent Zod input schemas
- [ ] `npx tsc --noEmit` passes
- [ ] Cache hit rate > 80% on product list under load
- [ ] All tests pass against tRPC procedures

---

## Session 5: GreenGrade

**Goal:** GreenGrade scoring is production-hardened. Water footprint dimension added
(if data from Pre-work P2 is available). Scoring outputs persist to Supabase for
analytics.

This session has two paths depending on the Pre-work P1 decision.

### Path A — Keep JavaScript (recommended)

**Optimise the existing algorithm:**
- Add water footprint as an 8th emission dimension (if data available)
- Persist computed scores to Supabase `product_scores` table (cache scoring output,
  invalidate on `products.json` update)
- Expose score history endpoint for analytics
- Validate scores against baseline fixture from Pre-work P3:
  ```bash
  node scripts/validate-scores.js  # asserts max delta < 0.1 vs baseline
  ```

### Path B — Port to Python

Only choose this path if a data science workflow requiring scipy/pandas is planned.

**FastAPI service (`/scoring`):**
- Implement Gaussian KDE with Silverman bandwidth (matches `greengrade.js` exactly)
- Variance-based feature weighting (7 emission dimensions)
- 60/40 category/global blending
- Sigmoid transform
- Mahalanobis anomaly detection (chi-squared 95th percentile, DF=7, threshold=14.067)
- Tikhonov regularisation

**Validation gate (mandatory before cutover):**
```bash
# Run both implementations against all 550 products
# Assert max absolute delta < 0.1 on score, exact match on grade
python scripts/validate-parity.py
```
Do not deploy if parity check fails.

**Hosting:** Render.com background worker (not a free-tier web service — avoids cold start
on scoring calls from tRPC procedures).

### Common to both paths

- Water footprint calculator (if data from P2 is ready):
  - New `/sustainability` tRPC router with `getWaterFootprint` procedure
  - Supabase `water_footprint` table: `{ product_id, blue_l, green_l, grey_l, source, confidence }`
  - Frontend: new `WaterFootprint` component on `ProductDetail` page

- `validateProductCatalog()` — add Supabase product count check alongside JSON validation

### Acceptance criteria

- [ ] Scores for all 550 products match baseline fixture (max delta < 0.1)
- [ ] Water footprint data present for all 550 products OR feature is explicitly not shipped
- [ ] `next build` clean
- [ ] All tests pass

---

## Summary

| Session | Layer | Duration estimate | Blocker |
|---------|-------|------------------|---------|
| Pre-work | — | 1–2 weeks (data) + 1 day (decisions) | Water footprint data source |
| S1: Data | Backend only | 2–3 days | Supabase project |
| S2: Frontend | Frontend only | 1 week | Tailwind audit from Pre-work P4 |
| S3: Auth | Both (small) | 1–2 days | S1 + S2 complete |
| S4: API type safety | Both | 3–4 days | S3 complete |
| S5: GreenGrade | Backend only | 3–5 days (Path A) / 1–2 weeks (Path B) | Pre-work P1 + P3 |

## Corrections to the Wiki

The wiki `hot.md` states 499 inline styles. Actual count confirmed 2026-04-26: **654**.
Update `wiki/hot.md` and `wiki/concepts/Product Catalog Schema.md` accordingly.
