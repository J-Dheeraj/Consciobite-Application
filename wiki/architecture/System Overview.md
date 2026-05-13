# System Overview

Consciobite is a sustainability scoring platform that rates food products across 7 supply-chain dimensions using the [[GreenGrade]] algorithm.

## Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   Next.js Frontend      │────▶│   Express.js Backend    │
│   (App Router)          │     │   (REST API)            │
│   Port 3000             │     │   Port 4000             │
└─────────────────────────┘     └─────────────────────────┘
                                          │
                                ┌─────────┴─────────┐
                                │   SQLite (better-  │
                                │   sqlite3)         │
                                └───────────────────┘
```

## Frontend Stack
- **Framework**: [[Next.js]] 14 App Router with `output: 'export'` (static site)
- **State**: [[React Query]] for server state, React Context for auth/theme
- **Routing**: File-based via `src/app/` directory
- **Build**: Static export -> `out/` renamed to `build/` (566 pages including 550 product pages)
- **API Base**: Runtime detection via `getApiBase()` in `httpClient.js` (no `next.config.js` rewrites — incompatible with static export)
- **Deployment**: Render Static Site (`build/`) or Docker (nginx with SPA fallback)

## Backend Stack
- **Framework**: Express.js with modular route handlers
- **Database**: SQLite via better-sqlite3
- **Auth**: JWT tokens with bcrypt password hashing
- **Scoring**: [[GreenGrade]] algorithm (Gaussian KDE + variance-based weighting)

## Key Modules
- [[safeFetch]] — Centralized API client (21 connections, primary god node)
- [[calculateGreenGrade]] — ML scoring engine (5 connections)
- [[Auth Security]] — Rate limiting with IP+email keyed lockout
- [[Data Provenance]] — Multi-tier confidence scoring

## Cross-References
- [[Frontend Routes]]
- [[API Endpoints]]
- [[GreenGrade Algorithm]]
- [[Static Export Pipeline]]
- [[Render Deployment]]
- [[Docker Build Context]]
