# Contributing to Consciobite

Thanks for your interest in contributing. This document covers how to set up the project, follow our conventions, and get a change merged.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (optional, for full-stack local runs)

## Local setup

```bash
# Clone
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# Backend
cd backend
cp .env.example .env        # fill in JWT_SECRET
npm install
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev                 # http://localhost:3000
```

Or with Docker:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

## Running tests

```bash
# Backend (156 tests)
cd backend && npm test

# Frontend
cd frontend && npm test
```

CI runs `npm run lint`, `npm run format:check`, `npm test`, `npm audit`, and `docker build` on every push. All steps must pass before a PR can be merged.

## Branch naming

| Type | Pattern | Example |
|---|---|---|
| New feature | `feat/<short-name>` | `feat/product-admin-panel` |
| Bug fix | `fix/<short-name>` | `fix/carbon-delete-404` |
| Chore / tooling | `chore/<short-name>` | `chore/upgrade-jest` |
| Docs | `docs/<short-name>` | `docs/api-examples` |

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Keep the subject line under 72 characters.

```
feat: add barcode history to scan page
fix: return 404 when carbon log not found
chore: upgrade better-sqlite3 to 9.x
docs: add passport endpoint to swagger
refactor: extract emission formatter to util
test: cover portfolio/score edge cases
```

## Code conventions

### Backend

- Routes live in `src/routes/` — business logic in `src/services/`. No logic in route handlers.
- All query params validated with `validate()` middleware (`pattern: /^\d+$/`, never `type: "number"`).
- Use the Winston logger (`src/middleware/logger.js`). No `console.log` in production code.
- Every new route file needs at least one Supertest integration test in `__tests__/`.
- Swagger JSDoc comments required for any new public endpoint.

### Frontend

- Pages go in `src/app/` (Next.js App Router). Reusable UI in `src/components/`.
- All API calls go through `src/services/` modules — never `fetch()` directly in a component.
- Use React Query for server state. No raw `useEffect` + `fetch` for data fetching.
- CSS custom properties for colors and spacing. No CSS frameworks or Tailwind.
- The `AUTH_EXPIRED_EVENT` constant (never the raw string `"auth-expired"`) for 401 events.

## Pull request checklist

- [ ] Branch is based on the latest `main`
- [ ] `npm test` passes locally
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] New routes have `validate()` middleware and at least one integration test
- [ ] Swagger docs updated if API surface changed
- [ ] No `console.log` left in production code
- [ ] PR is small and focused — one concern per PR

## Security rules — do not break these

- Rate limiting is in place at the API, auth, and scan route levels. Do not remove or loosen limits.
- All user input goes through `validate()` before handlers see it.
- CORS is restricted to exact deployment origins. Do not set it to `*`.
- CSRF double-submit pattern protects POST/PUT/DELETE on reviews, carbon, and admin routes.
- Docker containers run as non-root. Keep it that way.
- JWT secret must come from the environment. Never hardcode or commit it.

## Questions?

Open an issue or start a discussion on GitHub.
