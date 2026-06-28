# Contributing to Consciobite

Thanks for taking a look at Consciobite. This doc covers what you need to set up the project, the conventions the codebase follows, and what CI expects before a PR can merge.

## Project layout

- `backend/` — Node.js 20 + Express API, SQLite (better-sqlite3), GreenGrade scoring engine
- `frontend/` — Next.js 14 App Router, static export (`output: 'export'`)
- `wiki/` — Obsidian knowledge base; `wiki/hot.md` has recent context if you're picking up where someone left off

See `CLAUDE.md` for the full architecture rundown and the constraints that shape this codebase (why SQLite, why static export, etc.).

## Getting set up

```bash
# Backend
cd backend && npm install
export JWT_SECRET=dev-secret-change-me
npm run dev        # http://localhost:4000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev        # http://localhost:3000
```

Or with Docker:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

Copy `backend/.env.example` to `backend/.env` to configure locally instead of exporting env vars each time.

## Making a change

1. Branch off `main` using `feat/<name>`, `fix/<name>`, or `chore/<name>`.
2. Keep PRs small and focused — one concern per PR.
3. Backend logic goes in `src/services/`, not directly in route handlers. New routes need `validate()` middleware (see `backend/src/middleware/validate.js`) and at least one Supertest integration test in `__tests__/`.
4. Frontend API calls go through `src/services/` modules — never call `fetch()` directly from a component. New components need at least a render smoke test.
5. Anything touching GreenGrade score calculation needs a corresponding test.
6. No `console.log` in committed code — use the Winston logger (`backend/src/middleware/logger.js`) on the backend.

## Before opening a PR

CI runs lint, format check, tests, `npm audit`, and a Docker build — all of these must pass:

```bash
# Backend
cd backend
npm run format:check
npm run lint
npm test
npm audit --production --audit-level=high

# Frontend
cd frontend
npm run format:check
npm run lint
npm run build
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Keep the subject line under 72 characters.

## Things that need a discussion first

Some changes touch decisions that were made deliberately and shouldn't be revisited in a drive-by PR:

- Migrating off SQLite (a plan exists at `wiki/concepts/Stack Migration Plan.md`)
- Changing the account lockout threshold (currently 5 failed attempts)
- Loosening CORS, rate limiting, or anything else listed under "Security rules" in `CLAUDE.md`

Open an issue or start a discussion before sending a PR for any of these.

## Reporting issues

Open a GitHub issue with steps to reproduce. For security-sensitive issues, please email rajdheeraj26@gmail.com instead of filing a public issue.
