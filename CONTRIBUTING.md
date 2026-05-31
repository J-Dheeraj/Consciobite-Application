# Contributing to Consciobite

Thank you for your interest in contributing. This document covers how to get set up, the conventions we follow, and the process for submitting changes.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Local setup

```bash
# Clone the repo
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# Backend
cd backend
cp .env.example .env          # edit JWT_SECRET before starting
npm install
npm run dev                    # http://localhost:4000

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev                    # http://localhost:3000
```

Or use Docker:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

---

## Running tests

```bash
# Backend (138 tests)
cd backend && npm test

# Frontend lint
cd frontend && npm run lint

# Backend lint + format check
cd backend && npm run lint && npm run format:check
```

CI runs lint → format → test → audit → Docker build on every pull request. All checks must pass before merging.

---

## Branching conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/product-search-filters` |
| Bug fix | `fix/<short-description>` | `fix/carbon-log-delete-404` |
| Chore/docs | `chore/<short-description>` | `chore/update-dependencies` |

Work against the `main` branch. Open a pull request when your branch is ready.

---

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Keep the subject line under 72 characters.

```
feat: add product search by barcode
fix: correct carbon summary when no logs exist
chore: update better-sqlite3 to 9.6
docs: add CONTRIBUTING.md
refactor: extract GreenGrade score normalisation to helper
test: add integration tests for admin conflict-log route
```

---

## Code conventions

### Backend

- Route handlers live in `backend/src/routes/` — keep them thin.
- Business logic belongs in `backend/src/services/`.
- All user input must pass through `validate()` middleware (`backend/src/middleware/validate.js`) before reaching handlers. Use `pattern: /^\d+$/` for numeric IDs — not `type: "number"`.
- Use the Winston logger (`backend/src/middleware/logger.js`) — no `console.log` in committed code.
- New routes need at least one Supertest integration test in `backend/__tests__/`.
- If the API surface changes, update the Swagger doc comments.

### Frontend

- Page components live in `frontend/src/app/` (Next.js App Router).
- Reusable UI components live in `frontend/src/components/`.
- API calls go through `frontend/src/services/` modules — never call `fetch()` directly in a component.
- Use React Query (`@tanstack/react-query`) for server state — no raw `useEffect + fetch`.
- Styling uses CSS custom properties (see `globals.css`) and the helpers in `pageStyles.js`. Do not introduce Tailwind or another CSS framework.
- Dynamic routes need `generateStaticParams()` because the build uses `output: 'export'`.

### Security

- Never hardcode `JWT_SECRET` or any secret. Read from environment variables only.
- Do not weaken rate-limiting, CORS configuration, or the 5-attempt account lockout.
- CSRF double-submit pattern protects all mutating routes (reviews, carbon, admin). Don't bypass it.
- Docker containers run as non-root. Keep it that way.

---

## Pull request checklist

Before opening a PR, verify:

- [ ] All tests pass (`cd backend && npm test`)
- [ ] No lint errors (`npm run lint` in both `backend/` and `frontend/`)
- [ ] No Prettier violations (`cd backend && npm run format:check`)
- [ ] New routes have `validate()` middleware and at least one integration test
- [ ] No `console.log` left in production code
- [ ] Swagger docs updated if the API surface changed
- [ ] `wiki/hot.md` updated if the change is architecturally significant

---

## Architecture notes

- **Database:** SQLite (better-sqlite3, WAL mode). The file lives in `backend/db/consciobite.db` and is not committed.
- **Product catalog:** 550 products in `backend/src/data/products.json` — edit this file to add or change products. There is no admin UI for the catalog yet.
- **Static export:** The frontend builds to `build/` (Next.js outputs to `out/`, build script renames it). No server-side features — API routes, middleware, and rewrites don't work.
- **Auth:** JWT tokens stored in httpOnly cookies. `requireAuth` middleware validates them. Admin-only routes additionally check `users.role = 'admin'` via `requireAdmin` middleware.
- **Governance:** Score changes are logged in `score_change_logs` with a paying-client flag. See `backend/src/services/scoreAudit.js` and the admin routes at `/api/admin/*`.

For deeper context see the [wiki](wiki/) — start with `wiki/hot.md`.
