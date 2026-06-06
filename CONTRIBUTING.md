# Contributing to Consciobite

Thank you for your interest in contributing. This guide covers the development workflow, coding conventions, and how to run the project locally.

## Prerequisites

- Node.js 20+
- npm 10+
- Git

## Getting started

```bash
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# Backend
cd backend
cp .env.example .env          # fill in JWT_SECRET
npm install
npm run dev                   # http://localhost:4000

# Frontend (separate terminal)
cd ../frontend
npm install
npm run dev                   # http://localhost:3000
```

Or with Docker Compose:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

## Branch and commit conventions

- Branches: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` new feature
  - `fix:` bug fix
  - `chore:` maintenance, deps, config
  - `docs:` documentation only
  - `refactor:` code change with no behaviour change
  - `test:` tests only
- Subject line must be ≤ 72 characters, imperative mood ("add" not "added")

## Running tests

```bash
# Backend (137 tests)
cd backend && npm test

# Frontend lint
cd frontend && npm run lint
```

CI must be green before any PR is merged. The pipeline runs lint → format check → tests → `npm audit` → Docker build.

## Code conventions

### Backend

- Route handlers live in `src/routes/`. Business logic goes in `src/services/` — never inline in handlers.
- Every route must use `validate()` from `src/middleware/validate.js`. Query param patterns use `pattern: /^\d+$/`, not `type: "number"`.
- Use the Winston logger (`src/middleware/logger.js`). No `console.log` in committed code.
- New routes need at least one Supertest integration test in `__tests__/`.

### Frontend

- Pages go in `src/app/` (Next.js App Router). Reusable UI goes in `src/components/`.
- Server state (API calls) must use **React Query** (`useQuery`, `useMutation`). Do not use `useEffect` + `fetch` for data fetching.
- API calls go through modules in `src/services/` — never `fetch()` directly in a component.
- Use the existing CSS custom properties for colours and spacing. Do not introduce Tailwind or a CSS framework.
- New pages need at least a render smoke test.

### Shared

- No `console.log` in production code.
- No comments explaining *what* code does — well-named identifiers do that. Only add a comment when the *why* is non-obvious.
- Do not add features, refactor, or introduce abstractions beyond what the task requires.

## Security rules

Do not weaken any of the following without a discussion:

- Rate limiting on API, auth, and barcode scan routes
- Account lockout after 5 failed login attempts
- `validate()` middleware on all routes
- CORS restricted to exact deployment origins (never `*`)
- Non-root Docker containers
- CSRF double-submit pattern on mutation routes
- httpOnly cookies for JWT tokens

## Architecture decisions

Key decisions are recorded in `wiki/`. Read `wiki/hot.md` first for recent context. Major changes (new dependencies, auth changes, database changes) should be discussed before implementation.

See `CLAUDE.md` for a full description of the tech stack, repo layout, and key invariants.

## Opening a pull request

1. Ensure `npm test` passes in `backend/`.
2. Ensure `npm run lint` passes in `frontend/`.
3. Keep PRs small and focused — one concern per PR.
4. Fill in the PR description with what changed and why.
