# Consciobite Application - Technical Documentation

> Empowering sustainable food choices through transparent environmental data.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [GreenGrade Algorithm (v3)](#greengrade-algorithm-v3)
4. [Data Provenance & Confidence System](#data-provenance--confidence-system)
5. [Backend API Reference](#backend-api-reference)
6. [Database Schema](#database-schema)
7. [Frontend Application](#frontend-application)
8. [Security & Middleware](#security--middleware)
9. [Testing](#testing)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Configuration Reference](#configuration-reference)

---

## Overview

Consciobite is a full-stack web application that scores food products on environmental sustainability using the proprietary **GreenGrade** algorithm. It evaluates carbon emissions across seven lifecycle dimensions and presents consumers with actionable data to make informed purchasing decisions.

**Key Capabilities:**
- Score 550+ food products on a 0-10 sustainability scale
- Barcode scanning with Open Food Facts fallback for unrecognized products
- Side-by-side product comparison (2-5 products)
- Personal carbon footprint tracking with weekly/monthly trends
- Sustainable recipe suggestions with green ingredient recommendations
- Full data provenance and methodology transparency
- User accounts with JWT authentication, reviews, and favorites

**Tech Stack:**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Node.js + Express 4.18 | REST API server |
| Database | SQLite (better-sqlite3) | User data, reviews, carbon logs |
| Frontend | React 18.2 + React Router 6 | Single-page application |
| Data Viz | Recharts 3.7 | Charts on Dashboard and CarbonTracker |
| Data Fetching | TanStack React Query 5 | Client-side caching, 2-min stale time |
| Barcode | html5-qrcode 2.3 | Camera-based barcode scanning |
| Auth | JWT (jsonwebtoken) + bcryptjs | Token-based authentication |
| Security | Helmet, CORS, HPP, rate limiting | Defense-in-depth |
| Logging | Winston 3.19 | Structured request/error logging |
| Caching | node-cache | In-memory response cache |
| API Docs | Swagger UI + swagger-jsdoc | OpenAPI 3.0 documentation |
| Error Tracking | Sentry | Optional crash reporting |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React 18)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Pages   │ │Components│ │ Contexts │ │Services│ │
│  │ (13 pg.) │ │ (11 cmp.)│ │Auth/Theme│ │ api.js │ │
│  └──────────┘ └──────────┘ └──────────┘ └────┬───┘ │
└──────────────────────────────────────────────┼─────┘
                                               │ HTTP/JSON
┌──────────────────────────────────────────────┼─────┐
│                 Backend (Express 4.18)        │     │
│  ┌─────────────────────────────────────────┐ │     │
│  │           Middleware Chain               │ │     │
│  │ Logger → Helmet → CORS → RateLimit →    │ │     │
│  │ BodyParser → HPP                        │ │     │
│  └─────────────────────────────────────────┘ │     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │     │
│  │  Routes  │ │ Services │ │  Middleware   │ │     │
│  │products  │ │greengrade│ │  auth (JWT)   │◄┘     │
│  │auth      │ │dataProv. │ │  cache        │       │
│  │reviews   │ │          │ │  logger       │       │
│  │carbon    │ │          │ │               │       │
│  │recipes   │ │          │ │               │       │
│  └────┬─────┘ └──────────┘ └──────────────┘       │
│       │                                            │
│  ┌────▼─────┐  ┌──────────────────────┐            │
│  │ SQLite   │  │ products.json (550)  │            │
│  │ (users,  │  │ Static product data  │            │
│  │ reviews, │  │ + emissions          │            │
│  │ carbon)  │  └──────────────────────┘            │
│  └──────────┘                                      │
└────────────────────────────────────────────────────┘
```

### Data Flow

1. **Startup:** Server loads `products.json` (550 products) and trains the GreenGrade ML model on the full catalog
2. **Request:** Client hits `/api/products` → cache check → if miss, run `enrichProduct()` → `calculateGreenGrade()` → `getProductProvenance()` → return enriched product
3. **Barcode Scan:** Local lookup first → if not found, query Open Food Facts API → estimate emissions from Ecoscore grade → score with GreenGrade

---

## GreenGrade Algorithm (v3)

GreenGrade is a data-driven sustainability scoring model that learns emission distributions from the product catalog at startup, then scores each product using statistical techniques from machine learning.

### Seven Emission Dimensions

Every product is measured across seven lifecycle stages (in kg CO2e):

| Dimension | Description |
|-----------|------------|
| **Land Use Change** | Carbon from converting natural ecosystems (forests, wetlands) to farmland |
| **Animal Feed** | Emissions from growing, processing, and transporting livestock feed |
| **Farm** | Direct farming operations: methane from livestock, N2O from fertilizers, energy |
| **Processing** | Post-harvest manufacturing and food preparation |
| **Transport** | Distribution and shipping from farm to retail |
| **Packaging** | Production of packaging materials (plastic, glass, cardboard) |
| **Retail** | Retail operations including refrigeration, lighting, and waste |

### Training Phase

Called once at server startup with all 550 products:

1. **Global KDE Statistics** - For each of the 7 dimensions, compute sorted values, mean, standard deviation, percentiles (p25, p50, p75, p95), and Silverman bandwidth: `h = 1.06 * min(sigma, IQR/1.34) * n^(-0.2)`
2. **Category Statistics** - Same per-dimension KDE stats computed per product category (9 categories)
3. **Covariance Matrix** - Per-category 7x7 covariance matrix with Tikhonov regularization (lambda=1e-6), inverted via Gauss-Jordan elimination for anomaly detection
4. **Feature Importance** - Variance-based weighting using coefficient of variation (70%) and normalized range (30%), weights sum to 1.0

### Scoring Pipeline

For each product, `calculateGreenGrade(emissions, category, product)` computes:

**Step 1: Per-Dimension KDE Scoring**
- Evaluate Gaussian KDE CDF at the product's emission value: `CDF(x) = (1/n) * sum(Phi((x - xi) / h))`
- Blend category and global CDFs: `blended = 0.6 * categoryCDF + 0.4 * globalCDF`
- Apply sigmoid transform: `score = sigmoid(1 - blendedCDF)` with k=5, midpoint=0.5

**Step 2: Weighted Aggregate**
- `finalScore = sum(categoryScore_i * featureWeight_i)` clamped to [0, 10]

**Step 3: Color Assignment**
- Green: 7.0 - 10.0 (low environmental impact)
- Yellow: 4.0 - 6.9 (moderate impact)
- Red: 0.0 - 3.9 (high impact)

**Step 4: Anomaly Detection (Mahalanobis Distance)**
- Compute: `D^2 = (x - mu)^T * Sigma^(-1) * (x - mu)`
- Flag as anomaly if `D^2 > 14.067` (chi-squared 95th percentile, 7 degrees of freedom)

**Step 5: Confidence & Ranking**
- Algorithm confidence: `min(1, categorySampleCount / 30)`
- Global percentile via KDE CDF on total emissions
- Category rank via category-specific KDE CDF

### Output Object

```javascript
{
  score: 0-10,              // Main sustainability score
  color: "green"|"yellow"|"red",
  totalEmissions: number,    // Sum of all 7 dimensions (kg CO2e)
  breakdown: [{
    category: "Land Use Change",
    emission: 0.3,
    maxReference: 9.8,       // 95th percentile from training
    categoryScore: 8.5,
    percentile: 85
  }, ...],                   // 7 items
  confidence: 0-1,           // Algorithm confidence
  percentile: 0-100,         // Global rank
  categoryRank: 0-100,       // Rank within category
  anomaly: {
    isAnomaly: boolean,
    distance: number,
    threshold: 3.75
  },
  // Data provenance fields
  dataConfidence: 0-1,
  dataTier: 1|2|3,
  dataTierLabel: "verified_lca"|"aggregated_database"|"estimated",
  sources: [{name, type, year, reliability}],
  sourceCount: number,
  referenceProduct: string|null,
  agreementWithReference: 0-1,
  lastVerified: "YYYY-MM"
}
```

### Mathematical Components

**Normal CDF Approximation (Abramowitz & Stegun 26.2.17):**
Maximum error < 7.5e-8. Used inside KDE CDF evaluation.

**Sigmoid Score Transform:**
```
sigmoidScore(x) = 10 * (sigmoid(5*(x - 0.5)) - low) / (high - low)
```
Compresses tails and expands the middle where most products cluster, giving better resolution.

**Gauss-Jordan Matrix Inversion:**
Full pivot with partial pivoting, handles 7x7 covariance matrices for Mahalanobis distance computation.

---

## Data Provenance & Confidence System

Every product receives a data confidence score quantifying how reliable its emissions data is. This system provides full transparency about data origins and quality.

### Data Tiers

| Tier | Label | Score | Description |
|------|-------|-------|-------------|
| 1 | Verified LCA | 1.0 | Emissions sourced from peer-reviewed lifecycle assessment studies, cross-validated against Poore & Nemecek (2018) |
| 2 | Aggregated Database | 0.7 | Data from curated databases like Open Food Facts Ecoscore |
| 3 | Estimated | 0.4 | Category-average baselines derived from published LCA research |

### Confidence Formula

```
confidence = 0.35 * tierScore + 0.20 * sourceCountScore + 0.30 * agreementScore + 0.15 * recencyScore
```

Where:
- **tierScore** = {1: 1.0, 2: 0.7, 3: 0.4}
- **sourceCountScore** = min(1, sourceCount / 3)
- **agreementScore** = 1 - normalizedRMSE (how well product data matches published reference)
- **recencyScore** = max(0, 1 - yearsSinceVerified / 5)

### Reference Data

The system cross-validates product emissions against published research from **Poore & Nemecek (2018)** - a meta-analysis of 570 studies covering 38,700 farms across 119 countries. Reference data covers 22 product types:

| Product | Total kg CO2e/kg | Primary Source |
|---------|-----------------|----------------|
| Beef | 59.6 | Poore & Nemecek 2018 |
| Chocolate | 18.7 | Poore & Nemecek 2018 |
| Coffee | 16.5 | Poore & Nemecek 2018 |
| Lamb | 24.5 | Poore & Nemecek 2018 |
| Shrimp | 11.8 | Poore & Nemecek 2018 |
| Cheese | 11.0 | Poore & Nemecek 2018 |
| Chicken | 6.9 | Poore & Nemecek 2018 |
| Tofu | 2.0 | Poore & Nemecek 2018 |
| Potatoes | 0.5 | Poore & Nemecek 2018 |

Each reference includes a full 7-dimension breakdown for cross-source agreement scoring.

### Data Sources

1. **Poore & Nemecek (2018)** - Peer-reviewed LCA. "Reducing food's environmental impacts through producers and consumers." Science, 360(6392), 987-992. [DOI:10.1126/science.aaq0216](https://doi.org/10.1126/science.aaq0216)
2. **Our World in Data (2020)** - Curated aggregation of Poore & Nemecek with country adjustments. [ourworldindata.org/food-ghg-emissions](https://ourworldindata.org/food-ghg-emissions)
3. **Open Food Facts** - Crowdsourced product database with Ecoscore grade (A-E) from Agribalyse LCA data. [world.openfoodfacts.org](https://world.openfoodfacts.org)
4. **Category Average Estimate** - Internal estimation from category-level LCA baselines.

### Confidence Interpretation

| Range | Label | Meaning |
|-------|-------|---------|
| 0.80 - 1.00 | High confidence | Well-supported by multiple peer-reviewed sources |
| 0.50 - 0.79 | Moderate confidence | At least one credible source, may use category estimates for some dimensions |
| 0.00 - 0.49 | Low confidence | Primarily estimated from category averages; directional guidance only |

### Known Limitations

- Emissions data represents category-level averages, not brand-specific supply chain measurements
- Transport emissions assume average global shipping distances and may vary by region
- Seasonal and regional farming variations are not captured
- Packaging emissions estimated based on typical packaging for the product type
- Scoring model is trained on current catalog and may shift as products are added

---

## Backend API Reference

Base URL: `/api`

### Health & Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{status: "ok", service: "Consciobite API", version: "2.0.0"}` |
| GET | `/methodology` | Full GreenGrade algorithm documentation, data sources, confidence scoring formula, tiers, and limitations |
| GET | `/docs` | Swagger UI interactive API documentation |

### Products

| Method | Endpoint | Auth | Cache | Description |
|--------|----------|------|-------|-------------|
| GET | `/products` | No | 120s | List products with pagination, search, filtering, sorting |
| GET | `/products/:id` | No | 120s | Get single product by ID |
| GET | `/products/scan/:barcode` | No | 120s | Barcode lookup (local + Open Food Facts fallback) |
| GET | `/products/compare?ids=1,2,3` | No | 120s | Compare 2-5 products side-by-side |
| GET | `/products/stats` | No | 120s | Category statistics (counts, averages) |

**GET /products query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| search | string | - | Search in name, brand, category (max 50 chars) |
| category | string | - | Filter by category (case-insensitive) |
| sort | string | - | `grade_asc`, `grade_desc`, `emissions_asc`, `emissions_desc` |
| page | integer | 1 | Page number |
| limit | integer | 20 | Results per page (max 100) |

**Response shape:**
```json
{
  "products": [/* enriched product objects */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 550,
    "totalPages": 28,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Barcode Scan Fallback Logic:**
1. Search local products.json by barcode
2. If not found, query Open Food Facts API: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
3. Map OFF categories to local categories (meat/poultry -> Protein, fish/seafood -> Seafood, etc.)
4. Estimate emissions from Ecoscore grade using base profiles with multipliers (A: 0.4x, B: 0.65x, C: 0.85x, D: 1.1x, E: 1.4x)

### Authentication

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/auth/register` | No | 20/15min | Create account (email, name, password) |
| POST | `/auth/login` | No | 20/15min | Login, returns JWT token |
| GET | `/auth/me` | JWT | 20/15min | Get current user profile |

**JWT Configuration:**
- Algorithm: HS256
- Expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
- Payload: `{id, email, iat, exp}`
- Header format: `Authorization: Bearer <token>`

**Password Security:**
- Hashing: bcryptjs with 10 salt rounds
- Minimum length: 6 characters

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reviews/:productId` | Optional | Get reviews with stats (count, average) |
| POST | `/reviews/:productId` | Required | Submit review (rating 1-5, optional comment) |
| DELETE | `/reviews/:reviewId` | Required | Delete own review only |

Unique constraint: one review per user per product.

### Carbon Tracker

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/carbon/summary` | Required | All-time, weekly, monthly totals + 90-day trend + top products |
| GET | `/carbon/logs?page=1` | Required | Paginated purchase history |
| POST | `/carbon/log` | Required | Log product purchase with emissions |
| DELETE | `/carbon/log/:id` | Required | Delete own log entry |

### Recipes

| Method | Endpoint | Auth | Cache | Description |
|--------|----------|------|-------|-------------|
| GET | `/recipes?tag=healthy` | No | 600s | List recipes with green ingredients |
| GET | `/recipes/:id` | No | 600s | Recipe details with top 5 green ingredients per category |

6 curated recipe templates: Green Power Bowl, Eco Smoothie Blast, Planet-Friendly Pasta, Low-Carbon Stir-Fry, Sustainable Breakfast Plate, Ocean-Friendly Poke Bowl.

---

## Database Schema

**Engine:** SQLite via better-sqlite3 (synchronous, file-based, no external dependency)
**Journal Mode:** WAL (Write-Ahead Logging) for concurrent reads
**Foreign Keys:** Enabled

### Tables

**users**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID v4
  email TEXT UNIQUE NOT NULL,    -- Normalized, validated
  name TEXT NOT NULL,            -- Max 50 chars
  password_hash TEXT NOT NULL,   -- bcryptjs hash (10 rounds)
  created_at TEXT DEFAULT (datetime('now'))
);
```

**reviews**
```sql
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,           -- UUID v4
  product_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,                  -- Max 500 chars, nullable
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(product_id, user_id)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

**carbon_logs**
```sql
CREATE TABLE carbon_logs (
  id TEXT PRIMARY KEY,           -- UUID v4
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,    -- Max 100 chars
  quantity REAL NOT NULL DEFAULT 1,  -- Range 0.1-100
  emissions REAL NOT NULL,       -- kg CO2e
  logged_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_carbon_user ON carbon_logs(user_id);
CREATE INDEX idx_carbon_date ON carbon_logs(logged_at);
```

---

## Frontend Application

### Page Inventory (14 Pages)

| Route | Page | Load | Description |
|-------|------|------|-------------|
| `/` | Home | Eager | Search bar with debounced lookup (250ms), product results, market illustration |
| `/product/:id` | ProductDetail | Eager | Full product view with GreenGrade breakdown, confidence badge, sustainability verdict, "Stats for Nerds" |
| `/scan` | Scan | Lazy | Camera barcode scanning with manual entry fallback |
| `/compare` | Compare | Lazy | Multi-select product comparison grid |
| `/favorites` | Favorites | Lazy | LocalStorage-backed saved products |
| `/about` | About | Lazy | Team, mission, GreenGrade explanation |
| `/tips` | Tips | Lazy | 16 sustainability tips in 4 categories + fun facts carousel |
| `/dashboard` | Dashboard | Lazy | Category bar/pie/radar charts, top 10 greenest products |
| `/login` | Login | Lazy | Email/password authentication |
| `/register` | Register | Lazy | Account creation form |
| `/carbon` | CarbonTracker | Lazy | Auth-gated carbon tracking with goals, trends, top products |
| `/recipes` | Recipes | Lazy | Tag-filtered recipe cards with green ingredients |
| `/methodology` | Methodology | Lazy | Full algorithm, tier, and source documentation |
| `*` | NotFound | Lazy | 404 page |

### Component Inventory (11 Components)

| Component | Description |
|-----------|-------------|
| **Navbar** | Sticky header, 7 nav links, auth status, theme toggle, mobile hamburger |
| **Footer** | 4-column layout, badges (Carbon Neutral, Open Data, Made in SG) |
| **BottomNav** | Mobile-only fixed bottom bar, 5 quick links |
| **GradeBadge** | Circular SVG progress ring with score, glow effect, two sizes |
| **ProductImage** | Category-based procedurally generated SVG (hash-based patterns) |
| **ProductCard** | List item with image, grade, emissions, favorite toggle |
| **GradeBreakdown** | 7-stage supply chain visualization with progress bars |
| **ReviewSection** | Star rating form, review list, stats, owner-delete |
| **MarketIllustration** | Decorative SVG market scene |
| **Skeleton** | Shimmer loading states for cards, lists, dashboard |
| **ErrorBoundary** | Catch render errors, show recovery UI |

### State Management

**Context Providers (2):**

| Context | State | Persistence |
|---------|-------|-------------|
| AuthContext | `{user, token, isAuthenticated, login(), logout()}` | localStorage (`consciobite_token`, `consciobite_user`) |
| ThemeContext | `{theme, toggleTheme()}` | localStorage (`consciobite_theme`) + system preference |

**Data Fetching:**
- TanStack React Query with 2-minute stale time, 1 retry
- `safeFetch()` wrapper auto-injects JWT Bearer token
- Dynamic API URL: supports Render.com subdomain detection, env var, localhost fallback

**Local Utilities:**
- `favorites.js`: localStorage-backed with custom event dispatch for cross-component sync
- Keys: `getFavoriteIds()`, `isFavorited(id)`, `toggleFavorite(id)`, `clearFavorites()`

### Design System

**CSS Custom Properties (index.css):**
- 10 shades of green, amber, red, and gray
- Backgrounds: primary, card, card-hover
- Text: primary, secondary, muted
- Shadows: sm, md, lg
- Border radius: sm (8px) through full (9999px)
- Transitions: fast (0.15s), base (0.25s)

**Dark Mode:**
- `[data-theme="dark"]` selector overrides all CSS variables
- Persists to localStorage, respects `prefers-color-scheme`

**Animations (9):**
`spin`, `fadeInUp`, `fadeIn`, `slideDown`, `growBar`, `ringFill`, `float`, `pulse`, `shimmer`

**Responsive Breakpoints:**
- Mobile-first design
- 480px: font size adjustments
- 768px: desktop nav visible, mobile nav hidden
- Bottom tab bar: mobile only
- Hamburger menu: mobile only

### Accessibility

- Skip-to-main-content link
- `aria-label`, `aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-selected`
- Semantic HTML: `<main>`, `<nav>`, `<footer>`, `<label>`
- Focus-visible outlines (2px green)
- Color not sole information carrier
- SVGs with `aria-hidden="true"` for decorative, `aria-label` for meaningful

---

## Security & Middleware

### Middleware Chain (in order)

1. **Request Logger** (Winston) - Logs method, URL, status, duration
2. **Helmet** - Security headers (XSS, clickjacking, MIME sniffing, etc.)
3. **CORS** - Dynamic origin validation, supports `*.consciobite.onrender.com`
4. **Rate Limiting** (3 tiers):
   - General API: 200 requests / 15 minutes
   - Barcode scan: 30 requests / 15 minutes
   - Auth endpoints: 20 requests / 15 minutes
5. **Body Parser** - JSON and URL-encoded, 10kb limit
6. **HPP** - HTTP Parameter Pollution protection
7. **X-Powered-By** disabled

### Input Validation

All user input is sanitized using `validator.js`:
- `validator.escape()` on all string inputs
- `validator.trim()` for whitespace
- `validator.isEmail()` + `validator.normalizeEmail()` for emails
- Length limits on all fields (50 chars search, 500 chars comments, etc.)
- Alphanumeric validation on IDs
- Numeric validation on barcodes (8-14 digits)

### Authentication Flow

```
Register → bcrypt hash (10 rounds) → Store in SQLite → Return JWT
Login → Lookup by email → bcrypt.compareSync → Return JWT
Protected Route → Extract Bearer token → jwt.verify → Attach req.user
```

### Caching

**Engine:** node-cache (in-memory)
- Default TTL: 300 seconds
- Check period: 60 seconds
- Max keys: 1000
- Cache key: `__cache__${req.originalUrl}`
- Only caches GET requests with 200 status
- Invalidation: pattern-based key deletion on write operations

**Applied caches:**
- Products routes: 120 seconds
- Recipe routes: 600 seconds
- Reviews and carbon: no cache (user-specific data)

---

## Testing

### Test Suite Summary

| File | Lines | Tests | Focus |
|------|-------|-------|-------|
| `backend/__tests__/api.test.js` | 206 | ~40 | HTTP endpoints, auth flow, pagination, search, barcode validation |
| `backend/__tests__/greengrade.test.js` | 875 | ~40 | KDE, sigmoid, Mahalanobis, anomaly detection, matrix ops, fallback scoring |
| `frontend/src/__tests__/App.test.js` | 49 | ~3 | Navigation rendering, skip link, routing |
| `frontend/src/__tests__/GradeBadge.test.js` | 33 | ~3 | Score display, size variants, color fallback |
| `frontend/src/__tests__/favorites.test.js` | 63 | ~6 | localStorage operations, toggle logic, events |
| **Total** | **1,226** | **~80** | **Full-stack coverage** |

### Running Tests

```bash
# Backend (Jest + Supertest)
cd backend && npm test

# Frontend (Jest + React Testing Library)
cd frontend && npm test
```

### CI Pipeline (.github/workflows/ci.yml)

Two parallel jobs on every push:

**Backend:**
1. `npm ci` (clean install)
2. `npm run format:check` (Prettier)
3. `npm run lint` (ESLint)
4. `npm test` (Jest)

**Frontend:**
1. `npm ci`
2. `npm run format:check`
3. `npm run lint`
4. `CI=true npm test -- --watchAll=false`
5. `npm run build` (production build)

**Docker:** Validates both Dockerfiles build successfully.

---

## Deployment & Infrastructure

### Render.com (Primary)

Defined in `render.yaml` (Infrastructure as Code):

**Backend Service:**
- Type: Web service, Node.js runtime
- Root: `backend/`
- Build: `npm install`, Start: `npm start`
- Health check: `GET /api/health`
- Plan: Free tier
- Env vars: `NODE_ENV=production`, auto-generated `JWT_SECRET`, `ALLOWED_ORIGINS` set to frontend URL

**Frontend Service:**
- Type: Static site
- Root: `frontend/`, Publish: `build/`
- Build: `npm install && npm run build`
- SPA rewrite: `/* -> /index.html` (200)
- Cache-Control: no-cache headers
- Dynamic `REACT_APP_API_URL` from backend service

### Docker

**docker-compose.yml** orchestrates both services:

```yaml
backend:  port 4000, volume: db-data:/app/data
frontend: port 80 (nginx), depends_on: backend
```

**Backend Dockerfile:** `node:20-alpine`, production deps only, health check via wget
**Frontend Dockerfile:** Two-stage (node:20-alpine build → nginx:alpine serve)

---

## Configuration Reference

### Environment Variables

**Backend (`backend/.env.example`):**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `JWT_SECRET` | dev key (change in production!) | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `DB_PATH` | `./consciobite.db` | SQLite file path |
| `LOG_LEVEL` | `info` | Winston log level |
| `NODE_ENV` | `development` | Environment mode |
| `SENTRY_DSN` | (empty) | Optional error tracking |

**Frontend (`frontend/.env.example`):**

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:4000` | Backend API base URL |
| `REACT_APP_SENTRY_DSN` | (empty) | Optional error tracking |

### Code Quality

**ESLint:** Strict mode with security rules (`no-eval: error`, `eqeqeq: error`, `no-var: error`)
**Prettier:** 100 char width, 2-space indent, double quotes, trailing commas (ES5), LF line endings

### Product Data

**550 products** across **9 categories:**

| Category | Count |
|----------|-------|
| Pantry | 99 |
| Snacks | 73 |
| Dairy & Eggs | 70 |
| Beverages | 59 |
| Grains | 56 |
| Protein | 53 |
| Fruits | 48 |
| Vegetables | 46 |
| Seafood | 46 |

Each product includes: id, name, brand, category, barcode, description, purchase links, and a 7-dimension emissions breakdown.

---

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd Consciobite-Application

# Backend
cd backend
cp .env.example .env
npm install
npm run dev          # starts on :4000

# Frontend (separate terminal)
cd frontend
npm install
npm start            # starts on :3000

# Run tests
cd backend && npm test
cd frontend && npm test

# Docker (alternative)
docker-compose up --build
```

API documentation available at `http://localhost:4000/api/docs` after starting the backend.

---

*Built by the Consciobite team: Adrin, Sanjay, Karthikraj, Shanthosh, and Dheeraj*
*Founded by five university friends bringing an interdisciplinary edge to sustainable food technology.*
