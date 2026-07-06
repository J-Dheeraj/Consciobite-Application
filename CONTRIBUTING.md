# Contributing to Consciobite

Thank you for your interest in contributing. This document covers setup, conventions, and the PR process.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Local Setup

```bash
# Clone the repo
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# Backend
cd backend
cp .env.example .env          # set JWT_SECRET to any long random string
npm install
npm run dev                   # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Or with Docker:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

---

## Running Tests

```bash
# Backend (117 tests)
cd backend && npm test

# Frontend
cd frontend && npm test
```

CI runs lint, format check, tests, `npm audit`, and a Docker build on every PR. All steps must pass before merging.

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<name>` | `feat/score-filter-chips` |
| Bug fix | `fix/<name>` | `fix/carbon-delete-error` |
| Chore / docs | `chore/<name>` | `chore/update-dependencies` |

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add minScore filter to products API
fix: surface delete error in carbon tracker
chore: bump better-sqlite3 to 9.6.0
docs: add CONTRIBUTING.md
refactor: migrate products page to React Query
test: add minScore filter integration tests
```

- Subject line under 72 characters
- Imperative mood ("add", not "added" or "adds")
- No period at the end

---

## Code Conventions

### Backend

- Routes live in `src/routes/`, business logic in `src/services/`
- Every new route must use `validate()` middleware from `src/middleware/validate.js`
- Use `pattern: /^\d+$/` for numeric query params — not `type: "number"`
- No `console.log` — use the Winston logger (`src/middleware/logger.js`)
- New routes need at least one Supertest integration test in `__tests__/`

### Frontend

- Page components in `src/app/`, reusable UI in `src/components/`
- Server state (API calls) uses **React Query** — no raw `useEffect` + `fetch`
- API calls go through `src/services/` modules only — never `fetch()` directly in a component
- Use the existing CSS custom properties for colors and spacing — no new CSS frameworks
- New pages need at least a render smoke test

### General

- No features beyond what the task requires — no premature abstraction
- Do not remove or loosen rate limiting, CORS restrictions, or input validation
- Docker containers must stay non-root

---

## Pull Request Process

1. Fork the repo and create a branch from `main` following the naming convention above.
2. Make your changes with focused, atomic commits.
3. Ensure `npm test` passes locally.
4. Run `npm run lint` and `npm run format:check` (or `npm run format` to auto-fix).
5. Open a PR against `main` with a clear description of **what** changed and **why**.
6. One concern per PR — keep diffs small and reviewable.

PRs that break CI (lint, format, tests, audit, Docker build) will not be merged until the pipeline is green.

---

## Reporting Issues

Please open a GitHub issue with:

- A clear description of the bug or feature request
- Steps to reproduce (for bugs)
- Expected vs. actual behaviour
- Relevant logs or screenshots

---

## Architecture Notes

See [CLAUDE.md](./CLAUDE.md) for the full tech stack, repo layout, key invariants, and coding conventions.  
See [METHODOLOGY.md](./METHODOLOGY.md) for the GreenGrade scoring algorithm.  
See [DOCUMENTATION.md](./DOCUMENTATION.md) for API reference and deployment details.
