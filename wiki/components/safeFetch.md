# safeFetch

The centralized API client function — the primary "god node" in the codebase with 21 edges in [[Graphify]].

## Location
`frontend/src/services/api.js`

## What It Does
Every frontend API call flows through `safeFetch()`:
1. Adds `Content-Type: application/json` header
2. Injects JWT auth token via `getAuthHeaders()`
3. Makes the fetch request
4. On 401: clears stored credentials, dispatches `auth-expired` event
5. Parses JSON response
6. Throws descriptive error on non-OK status

## Dependents (21 API functions)
- `fetchProducts()`, `fetchProduct()`, `scanBarcode()`
- `compareProducts()`, `fetchStats()`, `fetchRecommendations()`
- `registerUser()`, `loginUser()`, `fetchCurrentUser()`
- `fetchReviews()`, `submitReview()`, `deleteReview()`
- `fetchCarbonSummary()`, `fetchCarbonLogs()`, `logCarbonPurchase()`, `deleteCarbonLog()`
- `fetchRecipes()`, `fetchRecipe()`
- `fetchMethodology()`

## API Base
Uses Next.js proxy: `API_BASE = "/api"` — requests are rewritten to the backend via `next.config.js`.

## Cross-References
- [[System Overview]]
- [[API Endpoints]]
- [[Auth Security]]
