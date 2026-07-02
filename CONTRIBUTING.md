# Contributing to Consciobite

Thanks for your interest in contributing. This guide covers everything you need to get started.

---

## Prerequisites

- Node.js 20+
- Git
- A terminal

---

## Local setup

```bash
# 1. Clone the repo
git clone https://github.com/J-Dheeraj/Consciobite-Application.git
cd Consciobite-Application

# 2. Backend
cd backend
cp .env.example .env          # fill in JWT_SECRET
npm install
npm run dev                   # http://localhost:4000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Or use Docker:

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

---

## Branch naming

| Work type | Pattern | Example |
|-----------|---------|---------|
| New feature | `feat/<name>` | `feat/recipe-filters` |
| Bug fix | `fix/<name>` | `fix/carbon-log-validation` |
| Docs / config | `chore/<name>` | `chore/update-readme` |

Branch off `main`, not off another feature branch.

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/). Subject line under 72 characters:

```
feat: add barcode fallback for private-label products
fix: correct carbon log validation for quantities > 100
chore: bump express to 4.19
docs: add GreenGrade v3.0 methodology notes
refactor: extract portfolio scoring into service module
test: add integration tests for passport API
```

Do not use `Update X` or `Fix stuff` — be specific about what changed and why.

---

## Tests

Every new backend route needs at least one Supertest integration test.

```bash
cd backend && npm test          # runs all 162+ tests
```

The CI pipeline blocks merges if any test fails. Add your test file to `backend/__tests__/` following the existing pattern (`api.test.js`, `passport.test.js`, etc.).

For frontend components, add at least a render smoke test.

---

## Code style

Both packages use Prettier + ESLint. Run the formatter before committing:

```bash
# Backend
cd backend && npx prettier --write src/

# Frontend
cd frontend && npx prettier --write src/
```

CI runs `prettier --check` and `eslint`; formatting failures block the build.

**Key conventions:**
- No `console.log` in committed code — use the Winston logger on the backend.
- New Express routes go in `backend/src/routes/`. Business logic goes in `backend/src/services/`.
- New frontend pages go in `frontend/src/app/`. API calls go through `frontend/src/services/` modules — never `fetch()` directly in a component.
- All Express routes use `validate()` middleware from `backend/src/middleware/validate.js`. Query param numeric validation uses `pattern: /^\d+$/`, not `type: "number"`.
- CSS uses existing custom properties. Do not introduce Tailwind or a CSS framework.

---

## Security rules — do not break these

- Rate limiting is applied at the API level, auth routes, and the barcode scan route separately. Do not remove or loosen it.
- All user input goes through `validate()` middleware before reaching handlers.
- CORS is restricted to exact deployment origins — never `*`.
- Docker containers run as non-root. Keep it that way.
- CSRF double-submit pattern protects POST/PUT/DELETE on reviews, carbon, and admin routes.

---

## Submitting a pull request

1. Open a PR against `main`.
2. Keep the PR focused — one concern per PR.
3. Fill in the PR description: what changed, why, and how to test it.
4. CI must pass before a PR can be merged.

If you're fixing a bug, include a test that fails before your fix and passes after.

---

## Key invariants

- `AUTH_EXPIRED_EVENT` is the shared constant for the 401 event bus — never use the raw string `"auth-expired"`.
- `WEEKLY_CARBON_GOAL_KG` lives in `frontend/src/utils/constants.js`.
- `/carbon` route is protected by `RequireAuth` — do not add in-page auth gates.
- JWT tokens are stored in httpOnly cookies.

---

## Questions?

Open a GitHub Issue or reach the maintainer at rajdheeraj26@gmail.com.
