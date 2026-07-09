# Contributing to Consciobite

Thanks for your interest in contributing to Consciobite — a food sustainability scoring platform built on open methodology. Before you open a PR, read this guide.

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# Backend
cd backend && npm install
cp .env.example .env       # fill in JWT_SECRET
npm run dev                # http://localhost:4000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev                # http://localhost:3000
```

---

## Branches

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Tooling, config, deps |
| `docs/` | Documentation only |
| `refactor/` | Restructuring without behaviour change |
| `test/` | Tests only |

Branch off `main`. Target `main` in your PR.

---

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/). Subject line under 72 characters.

```
feat: add weekly carbon comparison chart to dashboard
fix: return 404 instead of 500 on unknown product ID
chore: upgrade better-sqlite3 to v9
docs: add scan route to Swagger spec
```

---

## Running Tests

```bash
# Backend (117 tests)
cd backend && npm test

# Frontend
cd frontend && npm test

# Linting & formatting
cd backend && npm run lint && npm run format:check
cd frontend && npm run lint
```

CI runs all of the above. Your PR must be green before merging.

---

## What Good PRs Look Like

- **Small and focused.** One concern per PR. If you are fixing a bug *and* refactoring adjacent code, split them.
- **Tests included.** New routes need at least one Supertest integration test. New frontend components need a render smoke test.
- **Validate all input.** All Express routes must use the `validate()` middleware from `backend/src/middleware/validate.js`. Use `pattern: /^\d+$/` for numeric query params — not `type: "number"`.
- **No `console.log`.** Use the Winston logger (`backend/src/middleware/logger.js`) on the backend. Remove any debug logs before committing.
- **Updated Swagger docs.** If you change the API surface (new routes, new request/response fields), update the JSDoc Swagger annotations in the route file.

---

## Key Constraints

- **SQLite is intentional.** Do not introduce Postgres or another DB without prior discussion.
- **Static Next.js export.** No API routes, middleware rewrites, or server-only Next.js features. Dynamic routes need `generateStaticParams()`.
- **CSS custom properties only.** No Tailwind, no CSS frameworks. Match the existing `var(--lp-*)` / `var(--color-*)` tokens.
- **Security rules must not be relaxed.** Rate limiting, CORS allowlist, account lockout (5 attempts), CSRF double-submit, and non-root Docker containers are all intentional. Do not remove or loosen them.

---

## Governance & Scoring

The GreenGrade scoring algorithm is managed with conflict-of-interest safeguards. If your change touches scoring logic in `backend/src/services/greengrade.js`, you must:

1. Explain the change in the PR description, including why the methodology is improved.
2. Add or update tests in `backend/__tests__/greengrade.test.js`.
3. Expect the change to be flagged for review by the GreenGrade Advisory Panel process.

---

## Filing Issues

Open a [GitHub Issue](https://github.com/J-Dheeraj/Consciobite-Application/issues) for:
- Bugs with clear reproduction steps
- Feature suggestions with a short rationale
- Methodology questions or score challenges

For score-specific concerns, you may also write to [governance@consciobite.com](mailto:governance@consciobite.com).
