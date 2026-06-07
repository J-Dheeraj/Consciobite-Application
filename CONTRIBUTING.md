# Contributing to Consciobite

Thank you for your interest in contributing. This document covers how to get set up, our coding conventions, and the process for submitting changes.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+

### Local setup

```bash
# Clone the repo
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

### Docker (optional)

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

---

## Project structure

```
Consciobite-Application/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express entry point
│   │   ├── routes/           # Route handlers
│   │   ├── services/         # Business logic (greengrade, scoreAudit, etc.)
│   │   ├── middleware/        # auth, validate, cache, logger
│   │   └── db/               # SQLite schema + migrations
│   └── __tests__/            # Supertest integration tests
└── frontend/
    └── src/
        ├── app/              # Next.js App Router pages
        ├── components/       # Reusable UI components
        ├── services/         # API client modules
        ├── context/          # AuthContext, ThemeContext
        └── utils/            # Constants, helpers
```

---

## Running tests

```bash
# Backend (142 tests)
cd backend && npm test

# Frontend lint
cd frontend && npm run lint
```

All tests must pass and lint must be clean before a PR is reviewed.

---

## Coding conventions

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add product comparison export
fix: correct barcode scan rate limit window
chore: update Node.js base image to 20.18
docs: update API surface in README
refactor: extract emissions formatter to utils
test: add edge case for zero-emission product
```

Keep the subject line under 72 characters.

### Branches

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
```

### Backend

- Route handlers live in `src/routes/` — keep them thin
- Business logic belongs in `src/services/`
- All route inputs go through `validate()` middleware from `src/middleware/validate.js`
- Use `pattern: /^\d+$/` for numeric query params (not `type: "number"`)
- Use the Winston logger (`src/middleware/logger.js`) — no `console.log` in production code
- Every new route needs at least one Supertest integration test in `__tests__/`

### Frontend

- Page components go in `src/app/`; reusable UI goes in `src/components/`
- All API calls go through `src/services/` modules — never `fetch()` directly in a component
- Use React Query for server state — no raw `useEffect` + `fetch` pattern
- CSS: use the existing CSS custom properties defined in `globals.css`. Do not add Tailwind or other CSS frameworks
- Use the `AUTH_EXPIRED_EVENT` constant from `utils/constants.js` for the 401 event bus — never the raw string

---

## Key invariants — do not break these

| Invariant | Location |
|---|---|
| `AUTH_EXPIRED_EVENT` constant for 401 event bus | `frontend/src/utils/constants.js` |
| `WEEKLY_CARBON_GOAL_KG` constant | `frontend/src/utils/constants.js` |
| `/carbon` route protected by `RequireAuth` | no in-page auth gates |
| httpOnly cookies + CSRF double-submit for JWT | `backend/src/middleware/auth.js` |
| All Express routes use `validate()` middleware | `backend/src/middleware/validate.js` |
| Admin routes check `users.role = 'admin'` | `backend/src/middleware/auth.js` |
| Rate limiting on API, auth, and scan routes | `backend/src/index.js` — do not loosen |
| Account lockout after 5 failed logins | `backend/src/routes/auth.js` — do not change threshold |
| Docker containers run as non-root | keep in any Dockerfile changes |

---

## Pull request checklist

- [ ] `npm test` passes in `backend/`
- [ ] `npm run lint` passes in `frontend/`
- [ ] New routes have `validate()` middleware and at least one integration test
- [ ] New frontend pages use React Query; no raw `useEffect` + `fetch`
- [ ] Swagger docs updated if the API surface changed
- [ ] No `console.log` left in backend code
- [ ] PR is focused on one concern

---

## Security

Do not submit PRs that:
- Hardcode credentials or secrets
- Weaken rate limiting or account lockout
- Expand CORS to `*`
- Remove input validation from any route
- Change Docker containers to run as root

If you find a security vulnerability, please report it privately rather than opening a public issue.

---

## Questions

Open a GitHub Discussion or reach out to the maintainers. See `CLAUDE.md` for a full architecture reference.
