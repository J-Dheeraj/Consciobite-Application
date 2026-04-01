# Consciobite

An application that enlightens users on the environmental footprint of edible products. Empowering consumers to make informed, sustainable choices every time they shop.

**Live:** [consciobite-app.onrender.com](https://consciobite-app.onrender.com)

## Features

- **GreenGrade Algorithm** — Scores food products 0-10 based on carbon emissions across 7 supply chain categories (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail)
- **Color-Coded Grades** — Green (7-10), Yellow (4-6.9), Red (0-3.9) for instant visual assessment
- **Emissions Breakdown** — Detailed per-category emissions data for transparency
- **Carbon Footprint Tracker** — Track and reduce your food-related carbon emissions with personalized insights and weekly goals
- **Barcode Scanning** — Look up any product's GreenGrade by barcode
- **Product Search & Filter** — Search, filter by category, and sort by sustainability score
- **Smart Comparisons** — Compare products side-by-side to find healthier, greener alternatives
- **Eco-Friendly Recipes** — Discover recipes curated for sustainability, with green ingredient suggestions
- **Reviews & Ratings** — Rate and review products to help the community
- **User Authentication** — Secure JWT-based registration and login
- **Dashboard & Analytics** — Visualize category scores, emissions data, and sustainability trends
- **Dark Mode** — Full light/dark theme support

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18.2 (Create React App) |
| Routing | React Router DOM 6.20 |
| Server State | TanStack React Query 5.90 |
| Charts | Recharts 3.7 |
| Barcode Scanner | html5-qrcode 2.3 |
| Error Tracking | Sentry |
| Styling | Vanilla CSS with CSS custom properties |
| Testing | React Testing Library + Jest |
| Linting | ESLint 8.56 + Prettier 3.2 |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4.18 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, CORS, HPP, express-rate-limit, account lockout |
| Validation | validator.js |
| Caching | node-cache (in-memory) |
| Logging | Winston |
| API Docs | Swagger UI + swagger-jsdoc |
| Testing | Jest 30 + Supertest 7.2 |

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
export JWT_SECRET=your-secret-here
npm run dev        # runs on http://localhost:4000
```

**Frontend:**

```bash
cd frontend
npm install
npm start          # runs on http://localhost:3000
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (`?search=`, `?category=`, `?sort=grade_desc`, `?page=`, `?limit=`) |
| GET | `/api/products/:id` | Product detail with full GreenGrade breakdown |
| GET | `/api/products/scan/:barcode` | Look up product by barcode |
| GET | `/api/products/compare?ids=` | Compare multiple products side-by-side |
| GET | `/api/products/stats` | Category statistics and aggregations |
| GET | `/api/products/:id/recommendations` | Get similar product recommendations |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/reviews/:productId` | Get reviews for a product |
| POST | `/api/reviews/:productId` | Submit a review (auth required) |
| DELETE | `/api/reviews/:reviewId` | Delete own review (auth required) |
| GET | `/api/carbon/summary` | Carbon footprint summary (auth required) |
| GET | `/api/carbon/logs` | Carbon log history (auth required) |
| POST | `/api/carbon/log` | Log a product purchase (auth required) |
| DELETE | `/api/carbon/log/:id` | Delete a carbon log (auth required) |
| GET | `/api/recipes` | Get recipe suggestions (`?tag=`) |
| GET | `/api/recipes/:id` | Get single recipe detail |
| GET | `/api/methodology` | GreenGrade methodology and data provenance |
| GET | `/api/health` | Health check |

## Project Structure

```
Consciobite-Application/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── db/schema.js          # SQLite schema and connection
│   │   ├── routes/               # API route handlers
│   │   ├── middleware/            # Auth, cache, validation, logging
│   │   ├── services/             # GreenGrade algorithm, data provenance
│   │   ├── data/products.json    # Product catalog
│   │   └── swagger.js            # OpenAPI spec
│   ├── __tests__/                # Backend tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/                # Page components
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth and Theme context providers
│   │   ├── services/api.js       # API client
│   │   └── utils/                # Constants and helpers
│   ├── __tests__/                # Frontend tests
│   ├── nginx.conf                # Production Nginx config
│   ├── Dockerfile
│   └── package.json
│
├── .github/workflows/ci.yml     # CI pipeline
├── docker-compose.yml            # Local Docker orchestration
├── render.yaml                   # Render.com deployment blueprint
└── README.md
```

## Security

- JWT authentication with HS256 algorithm pinning
- bcrypt password hashing (cost factor 12)
- Rate limiting (API-wide, auth, and scan endpoints)
- Account lockout after 5 failed login attempts
- Input sanitization with validator.js across all routes
- Helmet security headers (backend) + CSP/HSTS/X-Frame-Options (Nginx)
- Docker containers run as non-root users
- CORS restricted to exact deployment origins
- Swagger docs disabled in production

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Team

Built by Adrin, Sanjay, Karthikraj, Shanthosh, and Dheeraj — five university friends bringing interdisciplinary expertise to sustainable food technology.
