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

- **Frontend:** Next.js 14 App Router — `frontend/src/`
- **Backend:** Node.js + Express + SQLite — `backend/src/`
- **ML scoring:** GreenGrade KDE — `backend/src/services/greengrade.js`
- **Product catalog:** `backend/src/data/products.json` (550 products, validated at startup)
- **Tests:** `npm test` in both `backend/` and `frontend/`

## Key Invariants

- All Express routes use `validate()` middleware from `backend/src/middleware/validate.js` — query params need `pattern: /^\d+$/`, not `type: "number"`
- `AUTH_EXPIRED_EVENT` is the shared constant for the 401 event bus — never use the raw string `"auth-expired"`
- `WEEKLY_CARBON_GOAL_KG` lives in `frontend/src/utils/constants.js`
- `/carbon` route is protected by `RequireAuth` — do not add in-page auth gates
- httpOnly cookies store JWT tokens; CSRF double-submit pattern protects mutating routes

## Karpathy Principles

Behavioral guidelines to reduce common LLM coding mistakes.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals with success criteria.
- For multi-step tasks, state a brief plan with verification steps.
- Loop until verified, don't stop at "should work."

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current

## Branch

Active development: `claude/improve-application-S5njo`
