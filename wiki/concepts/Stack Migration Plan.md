---
type: concept
title: "Stack Migration Plan — SQLite/Express to Prisma/Supabase/Tailwind"
created: 2026-05-21
status: developing
tags: [migration, prisma, supabase, tailwind, shadcn, planning]
---

# Stack Migration Plan

Roadmap for migrating from the current stack to the target stack specified in the governance brief.

---

## Current Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Database | SQLite (better-sqlite3, WAL mode) | File-based, single-writer |
| ORM | Raw SQL via better-sqlite3 | Synchronous API |
| Backend | Express.js | Custom middleware (validate, auth, cache) |
| Frontend | Next.js 14 App Router | Static export (`output: 'export'`) |
| Styling | CSS Modules + inline styles + CSS variables | Design tokens in globals.css |
| Components | Custom (PageHero, GradeBadge, etc.) | No component library |
| Auth | JWT in httpOnly cookies | Custom implementation |

## Target Stack

| Layer | Technology | Migration Effort |
|-------|-----------|-----------------|
| Database | Supabase PostgreSQL | High — schema + queries + deployment |
| ORM | Prisma | Medium — replaces raw SQL |
| Backend | Express.js (keep) or migrate to Next.js API Routes | Low if keeping Express |
| Frontend | Next.js 14 App Router (keep) | None |
| Styling | Tailwind CSS | High — every component restyled |
| Components | shadcn/ui | Medium — replace custom components |
| Auth | Supabase Auth | Medium — replaces custom JWT |

## Migration Order

Migrations should be done in dependency order. Each phase should be independently deployable.

### Phase 1 — Prisma ORM (Low risk, high value)

Add Prisma as an ORM layer over the existing SQLite database first. This gives us:
- Type-safe database access
- Auto-generated migrations
- Familiar API for the governance brief code

**Steps:**
1. `npm install prisma @prisma/client`
2. `npx prisma init --datasource-provider sqlite`
3. Introspect existing schema: `npx prisma db pull`
4. Verify generated `schema.prisma` matches current tables
5. Replace raw SQL in route files with Prisma client calls
6. Add governance models (Manufacturer, ScoreChangeLog) to schema
7. Run `npx prisma migrate dev`

**Compatibility note:** Prisma works with SQLite. No need to change the database yet.

### Phase 2 — Tailwind CSS + shadcn/ui (Parallel, no backend dependency)

**Steps:**
1. Install Tailwind: `npm install -D tailwindcss postcss autoprefixer`
2. Configure `tailwind.config.js` with existing design tokens
3. Map CSS variable palette to Tailwind theme:
   - `--green-*` → `colors.green.*`
   - `--amber-*` → `colors.amber.*`
   - `--radius-*` → `borderRadius.*`
   - `--shadow-*` → `boxShadow.*`
4. Install shadcn/ui: `npx shadcn-ui@latest init`
5. Migrate components one at a time (start with low-risk pages like About, Tips)
6. Replace `pageStyles.js` helper functions with Tailwind utility classes
7. Convert CSS Modules (Navbar, ProductCard) last — highest risk

**Risk:** Styling regressions. Must visually verify every page.

### Phase 3 — Supabase Database (Breaking change, careful migration)

**Prerequisites:** Prisma ORM in place (Phase 1 complete)

**Steps:**
1. Create Supabase project
2. Update `prisma/schema.prisma` datasource to `postgresql`
3. Migrate schema to Supabase: `npx prisma migrate deploy`
4. Migrate data: export SQLite tables → import to Supabase
5. Update environment variables (DATABASE_URL)
6. Update deployment config (remove SQLite volume from docker-compose)
7. Test all queries (SQLite → PostgreSQL syntax differences: datetime functions, boolean types, etc.)

**Breaking changes to watch:**
- `datetime('now')` → `NOW()` / `CURRENT_TIMESTAMP`
- Integer booleans (0/1) → native BOOLEAN
- `GLOB` → `LIKE` / `ILIKE`
- No `ON CONFLICT ... DO UPDATE` syntax differences
- WAL mode not applicable

### Phase 4 — Supabase Auth (Last, highest risk)

**Steps:**
1. Set up Supabase Auth with email/password provider
2. Migrate user table to Supabase auth.users
3. Replace custom JWT middleware with Supabase auth middleware
4. Update frontend AuthContext to use Supabase client
5. Replace httpOnly cookie pattern with Supabase session management
6. Add RLS (Row Level Security) policies to Supabase tables
7. Add admin role via Supabase custom claims or app_metadata

**Risk:** Auth is woven through the entire app. Must test every authenticated flow.

## Preparation Already Done (Session 1)

The governance layer was built with migration-readiness in mind:
- SQL migration file structure maps cleanly to Prisma schema models
- `scoreAudit.js` service layer abstracts DB access (swap implementation later)
- `requireAdmin` middleware checks `users.role` — maps to Supabase custom claims
- Table/column naming follows Prisma conventions (snake_case)

## Files That Will Change Per Phase

| Phase | Backend Files | Frontend Files |
|-------|--------------|----------------|
| 1 (Prisma) | All route files, schema.js, migrate.js, scoreAudit.js | None |
| 2 (Tailwind) | None | All page.js files, all components, globals.css, pageStyles.js |
| 3 (Supabase DB) | prisma/schema.prisma, .env, docker-compose.yml | None |
| 4 (Supabase Auth) | middleware/auth.js, routes/auth.js, routes/admin.js | AuthContext.js, httpClient.js, login/register pages |
