# Contributing to Consciobite

## Setup

```bash
# Backend
cd backend && npm install
export JWT_SECRET=dev-secret-change-me
npm run dev        # http://localhost:4000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev        # http://localhost:3000
```

Copy `backend/.env.example` to `backend/.env` before running locally. See the README for the full environment variable reference.

## Branches

`feat/<name>`, `fix/<name>`, `chore/<name>`. Branch off `main`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Keep the subject line under 72 characters.

## Code conventions

- **Backend** — Express routes in `backend/src/routes/`, business logic in `backend/src/services/`. Don't put logic directly in route handlers. New routes need input validation via the `validate()` middleware (`backend/src/middleware/validate.js`) and at least one Supertest integration test in `backend/__tests__/`.
- **Frontend** — Page-level components in `frontend/src/app/`, reusable UI in `frontend/src/components/`. API calls go through `frontend/src/services/` modules — never call `fetch()` directly from a component. New components need at least a render smoke test.
- **CSS** — use the existing CSS custom properties for colors and spacing. No CSS framework or Tailwind.
- **No `console.log`** in committed backend code — use the Winston logger (`backend/src/middleware/logger.js`).
- Anything touching the GreenGrade score calculation (`backend/src/services/greengrade.js`) needs a corresponding test.

## Before opening a PR

```bash
cd backend && npm test && npm run lint && npm run format:check
cd frontend && npm run lint && npm run format:check && npm run build
```

CI runs lint, Prettier format check, tests, `npm audit`, and a Docker build — a PR is blocked if any step fails.

Keep PRs small and focused: one concern per PR.

## Security

Don't loosen rate limiting, the 5-attempt account lockout, CORS origin restrictions, or the CSRF double-submit pattern on mutating routes without discussing it first. Docker containers must keep running as non-root.

## Reporting issues

Open a GitHub issue with steps to reproduce, or email [rajdheeraj26@gmail.com](mailto:rajdheeraj26@gmail.com).
