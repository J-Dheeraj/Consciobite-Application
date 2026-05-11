# API Endpoints

All endpoints served by Express.js backend on port 4000. Frontend accesses via Next.js rewrites proxy (`/api/*`).

## Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List with search, category, sort, pagination |
| GET | `/api/products/:id` | Single product with [[GreenGrade Algorithm]] breakdown |
| GET | `/api/products/scan/:barcode` | Barcode lookup |
| GET | `/api/products/compare?ids=` | Side-by-side comparison |
| GET | `/api/products/stats` | Aggregate statistics |
| GET | `/api/products/:id/recommendations` | Similar products |

## Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user (requires auth) |

## Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/:productId` | Get reviews for product |
| POST | `/api/reviews/:productId` | Submit review (auth required) |
| DELETE | `/api/reviews/:reviewId` | Delete review (auth required) |

## Carbon Tracker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/carbon/summary` | User's carbon summary |
| GET | `/api/carbon/logs` | Purchase log history |
| POST | `/api/carbon/log` | Log a purchase |
| DELETE | `/api/carbon/log/:id` | Remove a log entry |

## Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | List recipes (optional tag filter) |
| GET | `/api/recipes/:id` | Single recipe |

## Methodology
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/methodology` | Scoring methodology docs |

## Frontend API Client
All endpoints accessed through [[safeFetch]] which handles:
- Auth headers (JWT Bearer token)
- Error responses (401 triggers logout)
- JSON parsing

## Cross-References
- [[System Overview]]
- [[Auth Security]]
- [[safeFetch]]
