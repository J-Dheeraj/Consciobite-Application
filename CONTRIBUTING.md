# Contributing to Consciobite

Thank you for your interest in contributing. Please read this guide before opening a PR.

---

## Ground rules

- **One concern per PR.** Keep changes small and focused.
- **CI must pass.** Lint, format, tests, `npm audit`, and Docker build all run on every PR.
- **Tests are required.** Every new backend route needs at least one Supertest integration test. New frontend components need a render smoke test.
- **No `console.log` in production code.** Use the Winston logger on the backend; strip debug logs before committing.
- **Match the existing style.** Do not introduce a CSS framework, switch linters, or reorganise unrelated files.

---

## Development setup

```bash
# Copy the example env file and fill in your JWT secret
cp backend/.env.example backend/.env
export JWT_SECRET=dev-secret-change-me

# Start both servers (separate terminals)
cd backend && npm install && npm run dev   # http://localhost:4000
cd frontend && npm install && npm run dev  # http://localhost:3000

# Or with Docker
docker compose up --build
```

---

## Branch naming

| Type | Pattern |
|------|---------|
| Feature | `feat/<short-name>` |
| Bug fix | `fix/<short-name>` |
| Chore / refactor | `chore/<short-name>` |

---

## Commit style

Follow [Conventional Commits](https://www.conventionalcommits.org/). Subject line ≤ 72 characters.

```
feat: add barcode scan history to user dashboard
fix: clamp carbon quantity before DB insert
chore: upgrade better-sqlite3 to 9.x
docs: expand GreenGrade methodology page
test: add portfolio score edge-case coverage
```

---

## Running tests

```bash
cd backend && npm test     # 160 backend tests (Jest + Supertest)
cd frontend && npm test    # Frontend component smoke tests
```

---

## Key conventions

### Backend

- **Routes** go in `backend/src/routes/`. Business logic goes in `backend/src/services/`. No logic directly in route handlers.
- **Validation** uses `validate()` from `backend/src/middleware/validate.js`. Query-param numbers use `pattern: /^\d+$/`, not `type: "number"`.
- **Auth** — `requireAuth` guards protected routes; `requireAdmin` guards admin routes. Do not add in-page auth gates on the frontend `/carbon` page.
- **Scoring invariant** — anything that touches `calculateGreenGrade()` must have a corresponding test in `__tests__/`.

### Frontend

- **Pages** go in `frontend/src/app/`. Reusable UI goes in `frontend/src/components/`.
- **API calls** go through `frontend/src/services/` modules only — never call `fetch()` directly inside a component.
- **Server state** — use React Query (`useQuery` / `useMutation`). No raw `useEffect` + `fetch`.
- **CSS** — use the existing CSS custom properties. No Tailwind, no CSS frameworks.
- **Constants** — `AUTH_EXPIRED_EVENT` and `WEEKLY_CARBON_GOAL_KG` live in `frontend/src/utils/constants.js`. Use those; never use raw strings.

---

## Security

- Do not loosen rate limits or CORS settings.
- All user input must pass through `validate()` before reaching a handler.
- JWT secrets come from environment variables — never hardcode them.
- CSRF double-submit pattern protects POST/PUT/DELETE on reviews, carbon, and admin routes.
- Docker containers run as non-root; keep it that way.

---

## What "done" means for a PR

- [ ] `npm test` passes in `backend/`
- [ ] `npm run lint` is clean in both `backend/` and `frontend/`
- [ ] `npm run format:check` passes (Prettier)
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] Docker builds cleanly (`docker compose build`)
- [ ] Swagger docs updated if the API surface changed (`@swagger` JSDoc on new routes)
- [ ] Wiki `wiki/log.md` updated if the change is architecturally significant
