# Contributing to Consciobite

Thanks for contributing. This document covers the workflow, conventions, and checks every change goes through.

## Getting started

```bash
# Backend
cd backend && npm install
export JWT_SECRET=dev-secret-change-me
npm run dev        # http://localhost:4000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev        # http://localhost:3000
```

Copy `backend/.env.example` to `backend/.env` for local config instead of exporting env vars by hand. See the README and `CLAUDE.md` for the full environment variable reference.

## Branching

Branch off `main` using one of:

- `feat/<name>` — new functionality
- `fix/<name>` — bug fixes
- `chore/<name>` — tooling, deps, non-feature maintenance

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Keep the subject line under 72 characters and explain *why* in the body when the change isn't self-evident.

## Code organization

- **Backend:** Express routes live in `backend/src/routes/`; business logic belongs in `backend/src/services/`, not in route handlers. Every route's inputs go through the `validate()` middleware (`backend/src/middleware/validate.js`) — use `pattern:` for numeric strings (e.g. `pattern: /^\d+$/`), not `type: "number"`.
- **Frontend:** Page-level components go in `frontend/src/app/`, reusable UI in `frontend/src/components/`. API calls go through `frontend/src/services/` modules only — never call `fetch()` directly from a component.
- **CSS:** use the existing CSS custom properties for color and spacing. Don't introduce a CSS framework or Tailwind (a stack migration is planned separately — see `wiki/concepts/Stack Migration Plan.md`).
- **Logging:** no `console.log` in committed backend code — use the Winston logger (`backend/src/middleware/logger.js`).

## Tests

- Every new backend route needs at least one Supertest integration test under `backend/__tests__/`.
- Every new frontend component needs at least a render smoke test.
- Anything touching GreenGrade score calculation (`backend/src/services/greengrade.js`) needs a corresponding test.

```bash
cd backend && npm test     # Jest + Supertest
cd frontend && npm test
```

## Before opening a PR

Run the same checks CI runs:

```bash
# Backend
cd backend && npm run format:check && npm run lint && npm test

# Frontend
cd frontend && npm run format:check && npm run lint && npm run build
```

CI also runs `npm audit --production --audit-level=high` and a Docker build check. All of it must pass before a PR can merge — there's no override.

## Security-sensitive changes

If your change touches auth, rate limiting, CORS, CSRF, or admin routes, re-read the "Security rules" section of `CLAUDE.md` first. In short: don't loosen rate limits or the account lockout threshold, don't widen CORS, and don't bypass `validate()` or `requireAdmin`/`requireAuth`.

## Pull requests

Keep PRs small and focused — one concern per PR. Update Swagger docs (`backend/src/swagger.js`) if you change the API surface, and update `wiki/` if the change affects architecture documented there.
