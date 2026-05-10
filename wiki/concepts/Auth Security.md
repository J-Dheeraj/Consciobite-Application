# Auth Security

Authentication and security hardening for the backend API.

## Architecture
- **JWT tokens** for stateless authentication
- **bcrypt** for password hashing with constant-time comparison
- **Rate limiting** with IP+email keyed lockout (Community 11 in [[Graphify]])

## Key Functions
- `attemptKey(email, ip)` — Generates composite lockout key
- `recordFailedAttempt()` — Tracks failed login attempts
- `isLockedOut()` — Checks if account is temporarily locked
- `clearAttempts()` — Resets attempt counter on success

## Security Measures

### Timing Attack Prevention
Login always runs `bcrypt.compare()` even for unknown emails using a dummy hash computed at module load. This prevents attackers from distinguishing valid vs invalid emails by response time.

### DoS Prevention
Lockout is keyed by `email|IP` combination, preventing:
- Brute force against individual accounts
- Cross-IP credential stuffing

### Memory Bounds
Uses bounded `Map` with FIFO eviction (`MAX_TRACKED_KEYS = 10000`) to prevent memory exhaustion from tracking too many lockout keys.

### Token Validation
- JWT expiry checked on client mount (AuthContext)
- 401 responses trigger automatic logout via `auth-expired` event
- Token stored in localStorage with SSR-safe guards

## Cross-References
- [[System Overview]]
- [[API Endpoints]]
