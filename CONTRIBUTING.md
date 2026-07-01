# Contributing to Consciobite

Thank you for your interest in contributing. This guide covers local setup, the development workflow, and the conventions the codebase follows.

---

## Prerequisites

- **Node.js 20+** (backend and frontend both require it)
- **npm 9+**
- A Unix-like shell (Linux, macOS, or WSL on Windows)
- Docker + Docker Compose (optional — only needed to test the container build)

---

## Getting started locally

### 1. Clone the repo

```bash
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # fill in JWT_SECRET with any long random string
npm install
npm run dev                  # starts at http://localhost:4000
```

The backend uses SQLite (file-based). On first start it creates `consciobite.db` and runs all migrations automatically. No database setup is needed.

### 3. Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev                  # starts at http://localhost:3000
```

The frontend is a Next.js 14 static export (`output: 'export'`). In dev mode it runs a live dev server; in production it builds a static `build/` directory served by Nginx.

### 4. Docker (optional)

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

The frontend Dockerfile uses the **repo root** as the build context so `generateStaticParams()` can read `backend/src/data/products.json` during the Next.js build step.

---

## Running tests

```bash
# Backend (117+ integration tests via Jest + Supertest)
cd backend && npm test

# Frontend (smoke tests)
cd frontend && npm test
```

The backend test suite is deterministic — it uses an in-memory SQLite database and skips all external API calls (Open Food Facts barcode lookups are skipped when `NODE_ENV=test`).

---

## Code conventions

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:      new feature
fix:       bug fix
test:      adding or updating tests
refactor:  code change that is not a fix or feature
docs:      documentation only
chore:     build scripts, deps, tooling
```

Keep the subject line under **72 characters**.

### Branches

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
```

### Backend

- Route handlers live in `backend/src/routes/`. Business logic goes in `backend/src/services/`.
- All Express routes must use `validate()` middleware (`backend/src/middleware/validate.js`) for user input. Query-param numbers use `pattern: /^\d+$/` — not `type: "number"`.
- Never put `console.log` in production code. Use the Winston logger (`backend/src/middleware/logger.js`).
- New routes need at least one Supertest integration test.

### Frontend

- Page-level components live in `frontend/src/app/`. Reusable UI components go in `frontend/src/components/`.
- API calls go through `frontend/src/services/` modules only — never `fetch()` directly in a component.
- Use React Query (`@tanstack/react-query`) for all server state. No raw `useEffect` + `fetch`.
- Use the existing CSS custom properties for colors and spacing. Do not add Tailwind or a CSS framework.
- The `AUTH_EXPIRED_EVENT` constant (in `frontend/src/utils/constants.js`) is the only way to signal a 401 on the event bus — never use the raw string.

### Security rules — do not break

- Rate limiting, account lockout, and CSRF protection are intentional. Do not remove or weaken them.
- CORS is restricted to explicit deployment origins — do not set it to `*`.
- Docker containers run as non-root. Keep it that way.
- JWT secret must come from the environment. Never hardcode it.

---

## Making a change

1. Branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes. Keep each PR focused on one concern.
3. Run lint, format check, and tests:
   ```bash
   cd backend && npm run lint && npm run format:check && npm test
   ```
4. Open a pull request against `main`. CI runs lint → format → test → audit → Docker build. All steps must pass before merge.

---

## Project structure (quick reference)

```
Consciobite-Application/
├── backend/
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── services/      # Business logic (GreenGrade, scoreAudit, dataProvenance)
│   │   ├── middleware/    # auth, validate, cache, logger
│   │   ├── db/            # SQLite schema, migrations
│   │   └── data/          # products.json (550-product catalog)
│   └── __tests__/         # Jest + Supertest integration tests
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext, ThemeContext
│   │   ├── services/      # API client modules
│   │   └── utils/         # Constants, page style helpers
│   └── Dockerfile
├── docker-compose.yml
└── wiki/                  # Knowledge base (read wiki/hot.md first)
```

Full architecture notes are in `CLAUDE.md` and the `wiki/` knowledge base.

---

## Questions?

Open an issue at [github.com/J-Dheeraj/Consciobite-Application/issues](https://github.com/J-Dheeraj/Consciobite-Application/issues).
