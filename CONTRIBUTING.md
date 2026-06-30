# Contributing to Consciobite

Thanks for taking the time to contribute. Please read this guide before opening issues or pull requests.

---

## Development setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for the full stack)

### Backend

```bash
cd backend
cp .env.example .env          # fill in JWT_SECRET
npm install
npm run dev                   # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

### Full stack (Docker)

```bash
export JWT_SECRET=dev-secret-change-me
docker compose up --build
```

---

## Branches

| Prefix | Use |
|--------|-----|
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Dependency bumps, tooling, CI |
| `docs/<name>` | Documentation only |
| `refactor/<name>` | Code changes with no behaviour change |
| `test/<name>` | Test-only changes |

Target `main` with your pull request. One concern per PR — keep them small and focused.

---

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>: <short summary under 72 characters>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

Examples:

```
feat: add barcode scanner retry on timeout
fix: clamp carbon quantity before DB insert
test: add integration tests for portfolio/score endpoint
```

Do not reference issue or PR numbers in the subject line.

---

## Tests

### Backend

Every new Express route must have at least one Supertest integration test in `backend/__tests__/`.

```bash
cd backend && npm test     # runs all 159 tests
```

Tests run in CI on every push. A PR cannot merge while tests are red.

### Frontend

Every new page or reusable component needs at least a render smoke test.

```bash
cd frontend && npm test
```

---

## Code style

Both backend and frontend are formatted with **Prettier** and linted with **ESLint**. CI enforces both.

```bash
# Backend
cd backend
npm run lint
npm run format:check         # or npm run format to auto-fix

# Frontend
cd frontend
npm run lint
```

No `console.log` in production code — use the Winston logger on the backend (`src/middleware/logger.js`).

---

## API changes

- All new Express routes must use `validate()` middleware from `backend/src/middleware/validate.js`.
- Use `pattern: /^\d+$/` for numeric query params — not `type: "number"` (see `validate.js`).
- Update the Swagger JSDoc comments in the route file if the API surface changes.
  Swagger UI is available at `http://localhost:4000/api/docs` in development.

---

## Security

- Never hardcode secrets. `JWT_SECRET` and any future credentials must come from environment variables.
- Rate limiting is applied globally and per-route. Do not remove or loosen it.
- All user input is validated by `validate()` before reaching route handlers.
- CORS is locked to exact origins. Do not set it to `*`.
- Docker containers run as non-root. Keep it that way.

---

## Pull request checklist

- [ ] Branch targets `main`
- [ ] Commits follow Conventional Commits
- [ ] `npm test` passes locally
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] New routes have `validate()` middleware and at least one integration test
- [ ] Swagger docs updated if the API surface changed
- [ ] No hardcoded secrets or debug `console.log` calls
- [ ] PR description explains *why*, not just *what*

---

## Questions?

Open an issue or start a discussion on GitHub. The wiki at `wiki/` has architecture context and decision records.
