# Consciobite — Claude Code Instructions

## What this project is

Consciobite is a full-stack web application that scores food products on their environmental footprint using the **GreenGrade algorithm** — a 0–10 score derived from carbon emissions across 7 supply-chain categories (Land Use Change, Animal Feed, Farm, Processing, Transport, Packaging, Retail). Users can scan barcodes, search products, compare alternatives, track their carbon footprint, and browse eco-friendly recipes.

Live: https://consciobite-app.onrender.com
Repo: https://github.com/J-Dheeraj/Consciobite-Application

---

## Wiki Vault

This project has a live knowledge base at `wiki/`. Always read `wiki/hot.md` first when starting a new session — it gives ~500 tokens of recent context (last audit, key decisions, current test state) without crawling the whole codebase.

```
wiki/
├── index.md          — master page index
├── hot.md            — recent-context cache (read this first)
├── log.md            — append-only operation log
├── sources/          — ingested source documents
├── entities/         — key files and components
├── concepts/         — architectural concepts and patterns
├── domains/          — cross-cutting concerns (security, a11y, errors)
├── questions/        — answered queries filed for reuse
└── meta/             — architecture overview, lint reports
```

Source documents (immutable) live in `.raw/`.

## Wiki Skills

| Task | Command |
|------|---------|
| Ingest a new source | `ingest <file>` |
| Ask an architecture question | `what do you know about <topic>` |
| Health check the vault | `lint the wiki` |
| File this conversation | `/save` |
| Research a new topic | `/autoresearch <topic>` |

---

## Tech stack

**Frontend** — Next.js 14 App Router (`output: 'export'` static site), React 18.2, TanStack React Query 5.90, Recharts 3.7, html5-qrcode, Sentry, CSS Modules + inline styles with CSS custom properties, ESLint (`next/core-web-vitals`) + Prettier.

**Backend** — Node.js 20, Express 4.18, SQLite via better-sqlite3 (WAL mode), JWT + bcryptjs auth, Helmet / CORS / HPP / express-rate-limit security stack, custom `validate()` middleware, node-cache (in-memory), Winston logging, Swagger UI + swagger-jsdoc (dev only), Jest 30 + Supertest 7.2.

**Governance layer** — Score change audit trail (`scoreAudit.js`), manufacturer tracking, admin routes (`/api/admin/*`), `requireAdmin` middleware. See `wiki/domains/Grading Independence Governance.md`.

**DevOps** — Docker (multi-stage, non-root, repo-root build context), Docker Compose, GitHub Actions CI (lint → format → test → audit → Docker build), Render.com deployment (static site for frontend, web service for backend).

---

## Repo layout

```
Consciobite-Application/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express entry point
│   │   ├── config.js             # Env config
│   │   ├── db/
│   │   │   ├── schema.js         # SQLite schema + connection
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
│   └── __tests__/
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   ├── components/           # Reusable UI (Navbar, PageHero, GradeBadge, etc.)
│   │   ├── context/              # AuthContext + ThemeContext
│   │   ├── services/             # httpClient.js + domain API modules
│   │   └── utils/                # Constants, pageStyles helpers
│   ├── next.config.js            # output: 'export'
│   ├── Dockerfile                # Multi-stage: Node build → nginx serve
│   └── nginx.conf
├── docker-compose.yml
├── render.yaml                   # Render Blueprint
└── wiki/                         # Obsidian knowledge base
```

---

## Key constraints and decisions

- **SQLite is intentional for now.** The app runs on Render free tier (single instance). Do not migrate to PostgreSQL without discussing it first. A migration plan exists at `wiki/concepts/Stack Migration Plan.md`.
- **node-cache is in-memory only.** It does not survive restarts. Do not store anything in cache that must persist.
- **Products come from `products.json`, not a database table.** Adding/editing products means editing that file. There is no admin UI for the product catalog yet.
- **Next.js static export** (`output: 'export'`). Build produces `out/` which is renamed to `build/`. Dynamic routes need `generateStaticParams()`. No server-side features (API routes, middleware, rewrites).
- **Docker build context is repo root** (not `./frontend`). The frontend Dockerfile uses `frontend/`-prefixed COPY paths so `generateStaticParams()` can read `backend/src/data/products.json` at build time.
- **Swagger is disabled in production.** Do not re-enable it in the production config.
- **JWT secret must come from the environment.** Never hardcode it or commit it.
- **CI must pass before merging.** The pipeline runs lint, Prettier format check, tests, `npm audit`, and Docker build. If any step fails, the PR is blocked.

## Key invariants

- All Express routes use `validate()` middleware from `backend/src/middleware/validate.js` — query params need `pattern: /^\d+$/`, not `type: "number"`
- `AUTH_EXPIRED_EVENT` is the shared constant for the 401 event bus — never use the raw string `"auth-expired"`
- `WEEKLY_CARBON_GOAL_KG` lives in `frontend/src/utils/constants.js`
- `/carbon` route is protected by `RequireAuth` — do not add in-page auth gates
- httpOnly cookies store JWT tokens; CSRF double-submit pattern protects mutating routes
- Admin routes use `requireAdmin` middleware — checks `users.role = 'admin'` in SQLite

---

## Coding conventions

- **Commits:** use Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Keep the subject line under 72 characters.
- **Branches:** `feat/<name>`, `fix/<name>`, `chore/<name>`.
- **Backend:** Express routes in `src/routes/`, business logic in `src/services/`. Do not put logic directly in route handlers.
- **Frontend:** Page-level components in `src/app/`, reusable UI in `src/components/`. API calls go through `src/services/` modules only — never `fetch()` directly in a component.
- **CSS:** use the existing CSS custom properties for colors and spacing. Do not introduce a CSS framework or Tailwind.
- **Tests:** every new route needs at least one Supertest integration test. Frontend components need at least a render smoke test.
- **No `console.log` in production code.** Use the Winston logger (`src/middleware/logger.js`) on the backend. Remove debug logs before committing.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | yes | Long random string. Never commit. |
| `NODE_ENV` | yes | `development`, `production`, or `test` |
| `PORT` | no | Backend port, default 4000 |
| `ALLOWED_ORIGINS` | no | Comma-separated CORS origins, default `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | no | Frontend build-time API URL (Docker/Render) |

Copy `backend/.env.example` to `backend/.env` before running locally.

---

## Running locally

```bash
# Backend
cd backend && npm install
export JWT_SECRET=dev-secret-change-me
npm run dev        # http://localhost:4000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev        # http://localhost:3000

# Or with Docker
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

---

## Running tests

```bash
cd backend && npm test     # 162 tests
cd frontend && npm test
```

---

## API surface (quick reference)

- `GET /api/products` — list with `?search=`, `?category=`, `?sort=grade_desc`, `?page=`, `?limit=`
- `GET /api/products/:id` — full GreenGrade breakdown
- `GET /api/products/scan/:barcode`
- `GET /api/products/compare?ids=`
- `POST /api/auth/register` / `POST /api/auth/login` / `POST /api/auth/logout`
- `GET /api/auth/me` / `POST /api/auth/refresh` / `GET /api/auth/csrf`
- `GET /api/carbon/summary` / `POST /api/carbon/log` / `DELETE /api/carbon/:id` (auth required)
- `GET /api/reviews/:productId` / `POST /api/reviews/:productId` / `DELETE /api/reviews/:id` (auth required)
- `GET /api/recipes` / `GET /api/methodology` / `GET /api/health`
- `GET /api/admin/conflict-log` / `POST /api/admin/rescore` (admin only)
- `POST /api/admin/manufacturers` / `GET /api/admin/manufacturers` (admin only)
- `POST /api/admin/product-manufacturer` / `POST /api/admin/manufacturers/:id/acknowledge-fee` (admin only)

Full spec available at `http://localhost:4000/api/docs` in development.

---

## Security rules — do not break these

- Rate limiting is applied at the API level, auth routes, and the barcode scan route separately. Do not remove or loosen these.
- Account lockout triggers after 5 failed login attempts. Do not change this threshold without discussing it.
- All user input goes through `validate()` middleware before hitting handlers.
- CORS is restricted to the exact deployment origins. Do not set it to `*`.
- Docker containers run as non-root. Keep it that way in any Dockerfile changes.
- CSRF double-submit pattern protects POST/PUT/DELETE on reviews, carbon, and admin routes.

---

## Known issues / planned improvements

- Product catalog is static JSON. A future admin panel for managing products is planned.
- In-memory cache breaks in multi-instance deployments. Redis migration is planned but not yet scoped.
- No `CONTRIBUTING.md` yet — one is planned.
- A GreenGrade Independent Advisory Panel governance structure is being set up to address the conflict of interest between manufacturer listing fees and independent scoring. See `wiki/domains/Grading Independence Governance.md`.
- Stack migration to Prisma/Supabase/Tailwind/shadcn is planned but not started. See `wiki/concepts/Stack Migration Plan.md`.

---

## What good output looks like

- Backend changes include updated Swagger docs if the API surface changes.
- New routes have input validation via `validate()` middleware.
- New frontend pages use React Query for server state — no raw `useEffect` + `fetch`.
- Anything touching the GreenGrade score calculation must have a corresponding test in `__tests__/`.
- Pull requests are small and focused. One concern per PR.

---

## Karpathy Principles

Behavioral guidelines to reduce common LLM coding mistakes.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals with success criteria.
- For multi-step tasks, state a brief plan with verification steps.
- Loop until verified, don't stop at "should work."

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current

## Branch

Active development: `claude/improve-application-S5njo`
