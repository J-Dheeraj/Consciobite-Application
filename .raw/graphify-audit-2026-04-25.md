# Consciobite — Improvement Plan

Generated from graphify knowledge graph analysis + full backend/frontend audit.
Status legend: ✅ done · 🔧 in progress · ⬜ pending · ❌ N/A (false positive)

---

## Already Fixed (this session)

| # | What | File(s) | Commit |
|---|------|---------|--------|
| 1 | Centralised `RequireAuth` route guard; removed in-page auth gate from CarbonTracker | `App.js`, `CarbonTracker.js` | 17779d2 |
| 2 | Wire `validate()` middleware into carbon POST /log, DELETE /log/:id and products GET /compare | `carbon.js`, `products.js` | 362009b |

---

## Backend Findings

### Security / Correctness

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| B1 | ✅ | `src/index.js` | 46 | CORS allowlist hardcoded as `/^consciobite-(app\|api)\.onrender\.com$/` — breaks on domain change, not configurable | Read from `ALLOWED_ORIGIN_PATTERN` env var; fall back to hardcoded value |
| B2 | ❌ | `src/middleware/cache.js` | 17 | Cache key is only `req.originalUrl` — flagged as auth-mixing risk | False positive — only public routes (`/api/products`, `/api/recipes`) use the cache; no per-user data is cached |
| B3 | ✅ | `src/routes/products.js` | 178–189 | `lookupOpenFoodFacts()` and the `/:id` + `/scan/:barcode` handlers were `async` with no top-level try-catch | Wrapped async route bodies in try-catch and forwarded errors via `next(err)` |
| B4 | ❌ | `src/routes/auth.js` | 29 | Empty `catch` block in JWT verify | False positive — `requireAuth` returns 401 in catch; `optionalAuth` deliberately proceeds without `req.user`. Both intentional |
| B5 | ✅ | `src/routes/reviews.js` | 44 | `POST /:productId` had inline `parseInt`/range check, no schema | Added `POST_REVIEW_SCHEMA` with `validate()` for `params.productId`, `body.rating` (number 1–5), `body.comment` (string ≤500) |
| B6 | ✅ | `src/routes/reviews.js` | 11, 87 | `GET` and `DELETE` had manual sanitisation but no schema | Added `PRODUCT_PARAM_SCHEMA` and `DELETE_REVIEW_SCHEMA` (UUID pattern) with `validate()` |
| B7 | ✅ | `src/routes/carbon.js` | 110–111 | `GET /logs` parsed `page`/`limit` with no schema | Added `GET_LOGS_SCHEMA` with `validate()` requiring `^\d+$` pattern on both query params |
| B8 | ✅ | `src/routes/recipes.js` | 141, 172 | `GET /` and `GET /:id` used inline `validator.escape()` only | Added `TAG_QUERY_SCHEMA` (optional string ≤50) and `RECIPE_ID_SCHEMA` (lowercase + dashes, ≤50) with `validate()` |

### Constants / Config

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| B9 | ✅ | `src/routes/products.js` | 147 | Magic number `10000` (OFF fetch timeout ms) | Extracted to `const OPEN_FOOD_FACTS_TIMEOUT_MS = 10_000` |
| B10 | ✅ | `src/routes/auth.js` | 15–16 | `MAX_ATTEMPTS`, `LOCKOUT_MS` magic numbers | Already named constants — verified, no change needed |
| B11 | ✅ | `src/index.js` | 21 | `PORT` default `4000` is a magic number | Extracted to `const DEFAULT_PORT = 4000` |

### Data Integrity

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| B12 | ✅ | `src/index.js` | 18, 29 | `products.json` loaded and trained on with no schema validation | Added `validateProductCatalog()` startup check enforcing `id`, `name`, `category`, and 7 numeric `emissions` keys |
| B13 | ✅ | `src/services/greengrade.js` | — | `calculateGreenGrade()` could throw on unknown category in recipes | Verified the existing `Pantry` baseline fallback handles unknown categories — no throw path remains |

### Coupling / Fragility

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| B14 | ✅ | `src/services/api.js` (frontend) + `src/context/AuthContext.js` | api.js:41, AuthContext.js:51 | `"auth-expired"` event name duplicated in two files | Extracted to `AUTH_EXPIRED_EVENT` in `src/utils/constants.js`; both sides now import the constant |

---

## Frontend Findings

### Silent Error Handling (no user feedback)

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| F1 | ✅ | `src/pages/CarbonTracker.js` | 36 | `deleteCarbonLog` swallowed errors | Added `deleteError` state and inline alert banner |
| F2 | ✅ | `src/components/ReviewSection.js` | 26 | `fetchReviews` swallowed errors | Added `loadError` state and alert message above the reviews list |
| F3 | ✅ | `src/components/ReviewSection.js` | 59 | `deleteReview` swallowed errors | Routed failures through existing `setError` so the user sees the message |
| F4 | ✅ | `src/pages/ProductDetail.js` | 121 | `logCarbonPurchase` swallowed errors | Added `logError` state and alert message below the Log Purchase button |
| F5 | ✅ | `src/pages/Compare.js` | 21 | Initial `fetchProducts` failure was silently set to empty | `.catch` now surfaces the error through existing `setError` UI |

### Accessibility

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| F6 | ✅ | `src/pages/CarbonTracker.js` | 408 | Delete (×) button had `title` but no `aria-label` | Added `aria-label={`Remove log for ${log.product_name}`}` |
| F7 | ✅ | `src/pages/Tips.js` | ~207 | Expand/collapse button had no accessible text | Added `aria-expanded` and dynamic `aria-label` |
| F8 | ✅ | `src/pages/Recipes.js` | ~99 | Expand/collapse button had no accessible text | Added `aria-expanded` and dynamic `aria-label` |

### Hardcoded Values

| # | Status | File | Line | Issue | Fix |
|---|--------|------|------|-------|-----|
| F9 | ✅ | `src/pages/CarbonTracker.js` | 47 | `weeklyGoal = 10` hardcoded | Moved to `WEEKLY_CARBON_GOAL_KG = 10` in `src/utils/constants.js` and imported |

---

## Tracking

Total findings: 23 (2 fixed in earlier commits, 19 fixed this round, 2 false positives)

Backend: 14 findings (12 ✅, 2 ❌)
Frontend: 9 findings (9 ✅)

Tests after all fixes: 95 backend ✅ · 44 frontend ✅
