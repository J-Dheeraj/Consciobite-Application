# Consciobite — Claude Code Instructions

## Wiki Vault

This project has a live knowledge base at `wiki/`. Always read `wiki/hot.md` first when starting a new session — it gives ~500 tokens of recent context (last audit, key decisions, current test state) without crawling the whole codebase.

```
wiki/
├── index.md          — master page index
├── hot.md            — recent-context cache (read this first)
├── log.md            — append-only operation log
├── sources/          — ingested source documents
├── entities/         — key files and components
├── concepts/         — architectural concepts and patterns
├── domains/          — cross-cutting concerns (security, a11y, errors)
├── questions/        — answered queries filed for reuse
└── meta/             — architecture overview, lint reports
```

Source documents (immutable) live in `.raw/`.

## Wiki Skills

Use the following skills when working with the vault:

| Task | Command |
|------|---------|
| Ingest a new source | `ingest <file>` |
| Ask an architecture question | `what do you know about <topic>` |
| Health check the vault | `lint the wiki` |
| File this conversation | `/save` |
| Research a new topic | `/autoresearch <topic>` |

## Project Stack

- **Frontend:** React 18 SPA — `frontend/src/`
- **Backend:** Node.js + Express + SQLite — `backend/src/`
- **ML scoring:** GreenGrade KDE — `backend/src/services/greengrade.js`
- **Product catalog:** `backend/src/data/products.json` (550 products, validated at startup)
- **Tests:** `npm test` in both `backend/` and `frontend/` (95 + 44 tests)

## Key Invariants

- All Express routes use `validate()` middleware from `backend/src/middleware/validate.js` — query params need `pattern: /^\d+$/`, not `type: "number"`
- `AUTH_EXPIRED_EVENT` is the shared constant for the 401 event bus — never use the raw string `"auth-expired"`
- `WEEKLY_CARBON_GOAL_KG` lives in `frontend/src/utils/constants.js`
- `/carbon` route is protected by `RequireAuth` in `App.js` — do not add in-page auth gates

## Branch

Active development: `claude/sweet-hamilton-ON05N`
