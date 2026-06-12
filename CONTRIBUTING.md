# Contributing to Consciobite

Thanks for your interest in contributing. This document explains the setup, conventions, and process.

---

## Prerequisites

- Node.js 20+
- npm 9+
- Git

## Local setup

```bash
# Clone and install
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# Backend
cd backend
cp .env.example .env          # fill in JWT_SECRET
npm install
npm run dev                   # http://localhost:4000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Or use Docker:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

## Running tests

```bash
cd backend && npm test        # 137 integration tests
cd frontend && npm test       # smoke tests
```

All tests must pass before opening a PR. CI also runs `npm run lint`, `npm run format:check`, and `npm audit`.

## Branching

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<name>` | `feat/export-csv` |
| Bug fix | `fix/<name>` | `fix/scan-timeout` |
| Chore | `chore/<name>` | `chore/bump-deps` |

Branch off `main`. Open a PR against `main` when ready.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CSV export for carbon logs
fix: correct pagination offset for category filter
chore: bump better-sqlite3 to 11.10
docs: add API reference for passport endpoint
refactor: extract useDebounce into shared hook
test: cover empty portfolio in passport route
```

Subject line under 72 characters. No trailing period.

## Code style

- **Backend:** Express routes in `src/routes/`, business logic in `src/services/`. Use `validate()` middleware on every route — query params need `pattern: /^\d+$/`, not `type: "number"`.
- **Frontend:** Page components in `src/app/`, reusable UI in `src/components/`. API calls go through `src/services/` modules only. Use React Query (`useQuery` / `useMutation`) for server state — no raw `useEffect` + `fetch` in pages.
- **CSS:** Use the existing CSS custom properties (`--green-*`, `--amber-*`, etc.). Do not add Tailwind or other CSS frameworks without discussion.
- **No `console.log` in production code.** Use the Winston logger on the backend. Remove debug logs before committing.
- Prettier is enforced in CI. Run `npm run format` before pushing.

## Adding a new API route

1. Create or extend a file in `backend/src/routes/`.
2. Add `validate()` middleware with a schema.
3. Write at least one Supertest integration test in `backend/__tests__/`.
4. Add Swagger JSDoc annotations if the route is public-facing.
5. Mount the router in `backend/src/index.js`.

## Adding a new frontend page

1. Create a directory under `frontend/src/app/` following Next.js App Router conventions.
2. Dynamic routes (e.g. `/product/[id]`) need a `generateStaticParams()` export so the static build produces pages for all known IDs.
3. Use `useQuery` for data fetching — see `frontend/src/app/dashboard/page.js` for an example.
4. Add a smoke test.

## Security rules — do not break these

- Do not remove or loosen rate limiting.
- Do not change the account-lockout threshold (5 failed attempts) without discussion.
- All user input must go through `validate()` middleware.
- Do not set CORS to `*`.
- Docker containers must run as non-root.
- Never hardcode or commit `JWT_SECRET`.

## Opening a PR

- Keep PRs small and focused — one concern per PR.
- Fill in the PR description: what changed and why.
- CI must be green before requesting a review.
- If your change touches the GreenGrade score calculation, add a test to `__tests__/greengrade.test.js`.

## Questions

Open a GitHub Discussion or file an issue.
