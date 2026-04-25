---
type: source
title: "GreenGrade Migration Brief 2026-04-25"
created: 2026-04-25
updated: 2026-04-25
status: mature
tags: [source, migration, planning]
related:
  - "[[Is the GreenGrade Migration Brief Accurate]]"
  - "[[Consciobite Architecture Overview]]"
  - "[[GreenGrade KDE Scoring]]"
---

# GreenGrade Migration Brief 2026-04-25

5-session plan to migrate Consciobite from its current stack to a modern full-stack architecture. Reviewed and critiqued in [[Is the GreenGrade Migration Brief Accurate]].

## Proposed Target Stack

| Layer | Current | Proposed |
|-------|---------|---------|
| Frontend framework | React 18 SPA | Next.js 14 (App Router) |
| API layer | Express REST | tRPC |
| Database | SQLite (better-sqlite3) | Supabase (PostgreSQL) |
| Auth | JWT HS256 | Supabase Auth |
| Scoring engine | Node.js (greengrade.js) | Python FastAPI microservice |
| Cache | node-cache | Upstash Redis |
| Styling | (claimed Tailwind — incorrect) | Tailwind CSS |
| ORM | — | Prisma |

## Sessions

- **Session 1**: Next.js scaffolding, tRPC router, Supabase schema, product seed, auth migration
- **Session 2**: Python FastAPI GreenGrade microservice, water footprint calculator
- **Session 3**: Upstash Redis caching layer
- **Session 4**: Next.js App Router migration (layouts, RSC, streaming)
- **Session 5**: Polish, observability, error boundaries, performance audit

## Known Errors in This Brief

See [[Is the GreenGrade Migration Brief Accurate]] for full analysis. Summary:

1. Scoring engine is JavaScript (536 lines), not Python — Session 2 is a full rewrite
2. Styling is inline styles + custom CSS, not Tailwind — install + 499 conversions needed
3. Product count is 550, not 576
4. Water footprint fields (`waterBlue`, `waterGreen`, `waterGrey`) do not exist in `products.json`
5. Products are in JSON (not SQLite) — Session 1 migration is a seed-from-JSON operation
