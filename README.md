# Consciobite

An application that enlightens users on the environmental footprint of edible products. Empowering consumers to make informed, sustainable choices every time they shop.

**Live:** [consciobite-app.onrender.com](https://consciobite-app.onrender.com)

## Features

- **GreenGrade Algorithm** — Scores 550 food products 0-10 based on carbon emissions across 7 supply chain categories (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail) using Gaussian Kernel Density Estimation with a non-linear sigmoid transform
- **Color-Coded Grades** — Green (7-10), Yellow (4-6.9), Red (0-3.9) for instant visual assessment
- **Emissions Breakdown** — Detailed per-category emissions data for transparency
- **Carbon Footprint Tracker** — Track and reduce your food-related carbon emissions with personalized insights and weekly goals
- **Barcode Scanning** — Look up any product's GreenGrade by barcode
- **Product Search & Filter** — Search, filter by category, and sort by sustainability score
- **Smart Comparisons** — Compare products side-by-side to find healthier, greener alternatives
- **Eco-Friendly Recipes** — Discover recipes curated for sustainability, with green ingredient suggestions
- **Reviews & Ratings** — Rate and review products to help the community
- **User Authentication** — Secure JWT-based registration and login with CSRF protection
- **Dashboard & Analytics** — Visualize category scores, emissions data, and sustainability trends
- **Governance & Transparency** — Independent Advisory Panel oversight, public score-change audit trail, and manufacturer onboarding with fee acknowledgement to address conflicts of interest
- **Dark Mode** — Full light/dark theme support

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router, static export) |
| UI | React 18.2 |
| Server State | TanStack React Query 5.90 |
| Charts | Recharts 3.7 |
| Barcode Scanner | html5-qrcode 2.3 |
| Error Tracking | Sentry |
| Styling | CSS Modules + inline styles with CSS custom properties |
| Linting | ESLint (next/core-web-vitals) + Prettier |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4.18 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, CORS, HPP, express-rate-limit, CSRF double-submit, account lockout |
| Validation | Custom `validate()` middleware with declarative schemas |
| Caching | node-cache (in-memory) |
| Logging | Winston (structured) |
| API Docs | Swagger UI + swagger-jsdoc (dev only) |
| Testing | Jest 30 + Supertest 7.2 (137 tests) |

### DevOps

| Layer | Technology |
|---|---|
| Containers | Docker (multi-stage builds, non-root users) |
| Orchestration | Docker Compose |
| CI/CD | GitHub Actions (lint, format, test, audit, Docker build) |
| Hosting | Render.com (Blueprint deployment) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker (optional, for containerized setup)

### Local Development

**Backend:**

```bash
cd backend
npm install
cp .env.example .env   # then edit JWT_SECRET
npm run dev             # http://localhost:4000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev             # http://localhost:3000
```

### Docker

```bash
export JWT_SECRET=your-secret-here
docker compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:4000
```

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Go to [render.com/deploy](https://render.com/deploy)
2. Connect your GitHub account and select this repository
3. Render will auto-detect the `render.yaml` blueprint
4. Click **Apply** to create both services (API + frontend)
5. Wait for deployment — your app will be live at `https://consciobite-app.onrender.com`

> Note: Free tier services spin down after inactivity. First request after idle may take 30-60 seconds.

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (`?search=`, `?category=`, `?sort=grade_desc`, `?page=`, `?limit=`) |
| GET | `/api/products/:id` | Product detail with full GreenGrade breakdown |
| GET | `/api/products/scan/:barcode` | Look up product by barcode |
| GET | `/api/products/compare?ids=` | Compare multiple products side-by-side |
| GET | `/api/products/stats` | Category statistics and aggregations |
| GET | `/api/products/:id/recommendations` | Similar product recommendations |
| GET | `/api/recipes` | Recipe suggestions (`?tag=`) |
| GET | `/api/recipes/:id` | Single recipe detail |
| GET | `/api/methodology` | GreenGrade methodology and data provenance |
| GET | `/api/transparency/stats` | Public governance statistics (aggregate only) |
| GET | `/api/health` | Health check |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/csrf` | Get CSRF token |

### Authenticated

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/:productId` | Get reviews for a product |
| POST | `/api/reviews/:productId` | Submit a review |
| DELETE | `/api/reviews/:id` | Delete own review |
| GET | `/api/carbon/summary` | Carbon footprint summary |
| GET | `/api/carbon/logs` | Carbon log history |
| POST | `/api/carbon/log` | Log a product purchase |
| DELETE | `/api/carbon/:id` | Delete a carbon log |

### Admin (requires `role: 'admin'`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/conflict-log` | Score change audit trail with paying-client attribution |
| POST | `/api/admin/rescore` | Rescore all 550 products and log changes |
| POST | `/api/admin/manufacturers` | Register a manufacturer |
| GET | `/api/admin/manufacturers` | List all manufacturers |
| POST | `/api/admin/product-manufacturer` | Link a product to a manufacturer |
| POST | `/api/admin/manufacturers/:id/acknowledge-fee` | Record listing fee acknowledgement |

## Project Structure

```
Consciobite-Application/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── config.js             # Environment config
│   │   ├── db/
│   │   │   ├── schema.js         # SQLite schema and connection
│   │   │   ├── migrate.js        # SQL migration runner
│   │   │   └── migrations/       # Sequential .sql files
│   │   ├── routes/
│   │   │   ├── products.js
│   │   │   ├── auth.js
│   │   │   ├── reviews.js
│   │   │   ├── carbon.js
│   │   │   ├── recipes.js
│   │   │   └── admin.js          # Governance admin routes
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT + requireAuth + requireAdmin
│   │   │   ├── validate.js       # Declarative schema validation
│   │   │   ├── cache.js          # In-memory GET caching
│   │   │   └── logger.js         # Winston structured logging
│   │   ├── services/
│   │   │   ├── greengrade.js     # GreenGrade ML scoring (KDE + sigmoid)
│   │   │   ├── scoreAudit.js     # Score change audit trail
│   │   │   └── dataProvenance.js # Data source tracking
│   │   ├── data/products.json    # 550 product catalog
│   │   └── swagger.js
│   ├── __tests__/                # 137 integration tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── admin/            # Admin pages (conflict-log, manufacturers)
│   │   │   ├── transparency/     # Public governance page
│   │   │   ├── carbon/           # Carbon tracker
│   │   │   ├── product/[id]/     # Dynamic product pages
│   │   │   └── ...               # 17 route directories
│   │   ├── components/           # Reusable UI (Navbar, PageHero, GradeBadge, etc.)
│   │   ├── context/              # AuthContext + ThemeContext
│   │   ├── services/             # httpClient.js + domain API modules
│   │   └── utils/                # Constants, pageStyles helpers
│   ├── next.config.js            # output: 'export' (static site)
│   ├── nginx.conf                # Production Nginx config
│   ├── Dockerfile                # Multi-stage: Node build -> nginx serve
│   └── package.json
│
├── wiki/                         # Obsidian knowledge base
├── .github/workflows/ci.yml     # CI pipeline
├── docker-compose.yml            # Local Docker orchestration
├── render.yaml                   # Render.com deployment blueprint
└── CLAUDE.md                     # Claude Code instructions
```

## Security

- JWT authentication with HS256 algorithm pinning
- CSRF double-submit pattern on all mutating routes
- bcrypt password hashing (cost factor 12)
- Rate limiting (API-wide, auth, and scan endpoints)
- Account lockout after 5 failed login attempts
- Declarative input validation via `validate()` middleware on all routes
- Helmet security headers (backend) + CSP/HSTS/X-Frame-Options (Nginx)
- Docker containers run as non-root users
- CORS restricted to exact deployment origins
- Swagger docs disabled in production
- Admin routes protected by `requireAdmin` middleware

## Running Tests

```bash
# Backend (137 tests)
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Team

Built by Adrin, Sanjay, Karthikraj, Shanthosh, and Dheeraj — five university friends bringing interdisciplinary expertise to sustainable food technology.
