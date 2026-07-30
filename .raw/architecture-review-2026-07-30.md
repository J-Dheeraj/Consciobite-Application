# External Architecture Review — 2026-07-30 (Second Review)

Reviewed GitHub `main` at commit `2cb26e9a15df0304411ce72741875bbd2a3ef522`, dated 30 July 2026.
Follow-up to the first review (commit `9914b96`, score 5/10, classification: Prototype).

---

Executive Summary
Consciobite has improved materially since the previous review. The latest GitHub `main` is commit `2cb26e9a15df0304411ce72741875bbd2a3ef522`, dated 30 July 2026.
The new revision fixes or improves:

* Production refresh and logout routing
* Proxy-aware client IP handling
* Database/model-aware health reporting
* Open Food Facts retry and degraded-state handling
* Score-change actor and reason attribution
* Accuracy of audit and regulatory claims in the README
* Frontend automated tests
* Frontend dependency-audit enforcement

The current GitHub Actions run passed all three jobs:

* Backend tests: passed
* Frontend build and tests: passed
* Docker build: passed

I also verified the deployed frontend returns HTTP 200 and the live API health endpoint reports the database writable, migrations present, GreenGrade operational and ML artefacts loaded.
However, the most important production blockers remain:

* SQLite data is deployed on an ephemeral Render free service without a persistent disk.
* The architecture cannot scale horizontally.
* JWTs remain accessible through `localStorage`.
* Logout does not revoke issued tokens.
* Security throttling and caching remain process-local.
* Monitoring, alerting, backup and recovery are inadequate.
* Product evidence and regulatory provenance are not yet enterprise-grade.

Production-readiness score: 6/10, improved from 5/10.
Classification: Pilot-ready, but only for a controlled, disposable-data pilot. It is not production-ready for real user, manufacturer or regulatory data.
Prompt Engineering: Not applicable. The system uses statistical and ML models but no LLM or autonomous agent.

Architecture Assessment
Strengths

* Clear frontend, backend, statistical scoring, ML insight and persistence boundaries.
* GreenGrade scoring remains separate from advisory ML.
* Parameterised SQL is used consistently.
* Database migrations execute transactionally.
* Production configuration fails closed when `JWT_SECRET` is absent.
* Admin roles are revalidated against current database state.
* Static catalogue scoring is efficient at the present 550-product scale.
* Containers run as non-root.
* The latest revision accurately describes the score audit as application-level rather than immutable.
* Runtime health now checks database writability and core scoring availability.
* External service failure is no longer incorrectly reported as a product miss.

Weaknesses
Persistence remains the decisive blocker
`render.yaml` still defines a free Render web service with no persistent disk. SQLite therefore stores users, reviews, carbon histories, manufacturers and audit records on an ephemeral filesystem.
The live database being writable only proves present availability. It does not prove durability. A redeployment, restart on a replacement host or infrastructure event may erase the database.
SQLite prevents horizontal scaling
WAL mode is appropriate for a single process, but multiple API instances cannot safely share this local database. Scaling the API would fragment or lose state.
Product data is release-coupled
The catalogue is committed JSON rather than an operational data model. Product updates require code changes, artefact regeneration and deployment. This is under-engineered for manufacturer onboarding, evidence review and versioned reporting.
Start-up remains overloaded
Database migration, scoring-model training, ML artefact loading and full score snapshotting run synchronously before the service starts. This is manageable now but increases cold-start and deployment failure risk as the catalogue grows.

Technical Debt

* Duplicate versioned and unversioned route registration.
* Render hostname inference remains embedded in frontend API discovery.
* Database, cache, rate-limit and lockout choices are tied to single-process operation.
* Generated wiki, graph and cache artefacts add repository noise.
* Static product lookup remains predominantly linear.
* Operational documentation still describes architecture more strongly than its runbooks and recovery controls support.

Architectural Risks

* Complete state loss after Render filesystem replacement
* No safe multi-instance scaling
* Catalogue deployment and scoring drift becoming tightly coupled
* Long-running scoring operations affecting web-process availability
* Audit history sharing the same failure domain as the application database

Quality Assessment
Design Quality
The design is sensible for a prototype and is not excessively over-engineered. The system does not need microservices, Kubernetes or event streaming yet.
The appropriate next architecture remains:

* Static frontend
* Stateless Express API
* Managed PostgreSQL
* Object storage for evidence and model artefacts
* Redis-backed distributed throttling where justified
* Separate ingestion and scoring workers
* Centralised observability

Integration Quality
The Open Food Facts integration is materially better:

* Ten-second per-attempt timeout
* Two retries with exponential backoff
* `404` for genuine misses
* `503` for upstream unavailability
* Timeout cleanup in `finally`

Remaining issues:

* Worst-case lookup latency is approximately 31 seconds.
* There is no circuit breaker.
* No integration health or latency metrics are recorded.
* Response payload size and schema are not rigorously constrained.
* Emissions returned for external products are still estimates derived from category baselines, not verified SKU footprints.

State and Memory Quality

* SQLite is durable only where the hosting filesystem is durable.
* Cache state is local to one process.
* Login-attempt state is an in-memory `Map`.
* Rate limiting uses the default in-memory store.
* Restarts clear abuse-control history.
* Multiple instances would enforce different security limits.
* Cache invalidation remains URL-string based.
* No idempotency keys or durable background-job state exist.

The newly added `trust proxy = 1` fixes the immediate Render client-IP issue, although a production configuration should document and restrict the trusted proxy topology.

Reliability
Improvements:

* Live health checks now verify database writability, migrations and core scoring.
* External integration outages have explicit degraded behaviour.
* CI now tests the frontend.
* All 29 backend JavaScript files passed syntax validation.
* The repository contains 161 backend and six frontend test declarations.
* All six frontend tests passed independently.
* Exact-lock GitHub CI passed backend, frontend and Docker jobs.

Limitations:

* The migration health check only verifies that at least one migration exists, not that every expected migration is applied.
* The health probe briefly acquires a SQLite write lock.
* There is no separate readiness and liveness model.
* No backup/restore test, chaos test, load test or deployment rollback evidence exists.
* The frontend tests cover only three simple components, not authentication, API behaviour or critical user workflows.

Security and Governance Assessment
Security Strengths

* JWT verification pins HS256.
* Production secrets fail closed.
* Passwords use bcrypt with cost 12.
* SQL is parameterised.
* Helmet, CORS, HPP and body-size controls are present.
* CSRF double-submit checks use constant-time comparison.
* Account enumeration has timing mitigation.
* Admin authority is checked from the database.
* Tiered rate limits are present.
* No apparent committed production credentials were detected.
* Containers run as non-root.
* Production Swagger exposure is disabled.

Security Concerns
JWTs remain exposed to JavaScript
`AuthContext.js` stores the bearer token in `localStorage`, while `auth.js` returns it in the response body.
A successful XSS can therefore extract a reusable authentication token. The HttpOnly cookie does not protect the duplicate token in local storage.
The preferred design is:

* HttpOnly, Secure, host-scoped authentication cookies
* Short-lived sessions or access tokens
* Rotating refresh tokens
* Server-side session/revocation records
* No bearer token persisted in browser storage

Logout does not revoke issued credentials
Logout clears the cookie but provides no `jti`, revocation record, session version or refresh-token reuse detection. A stolen token remains valid until expiry.
Process-local security controls
Rate limiting and account lockout reset on restart and diverge across instances. These must move to a distributed production store before scaling.
CI is not enforced before merge
Pull request 42 was created at 04:21:39 UTC and merged at 04:21:49 UTC. Its pull-request CI completed successfully at 04:23:09 UTC — after the merge.
Therefore, successful tests exist, but branch protection did not require them before merging. Required status checks, review approval and protected-branch rules should block merge until CI succeeds.
Frontend audit threshold
The frontend audit now fails on critical vulnerabilities, which is better than the earlier unconditional bypass. However, all high-severity client/runtime findings are permitted. Findings should be triaged by exploitability rather than excluded categorically.

Privacy Considerations
Still missing:

* Formal privacy notice and legal basis
* Retention schedule
* Account deletion
* User data export
* Consent management where applicable
* Log redaction policy
* Data classification
* Database encryption and key-management evidence
* Backup protection and deletion propagation
* Data residency and subprocessors documentation

Carbon history can reveal user purchasing behaviour and should be treated as personal behavioural data.

Governance Gaps
The new audit attribution is useful. Startup changes record `system:startup`, and admin rescoring records the authenticated administrator.
Nevertheless:

* Audit rows remain mutable SQLite records.
* No tamper-evident chaining or signatures exist.
* No external immutable checkpoint exists.
* Actor attribution is text rather than a durable actor foreign key.
* Input dataset version, source artefact hash and code revision are not bound into every score record.
* Fee acknowledgement is a mutable Boolean rather than a versioned signed acknowledgement.
* Governance-panel access and review workflows remain documentary rather than technically enforced.

The README now correctly states that tamper-evident storage is a roadmap item. That resolves the misleading claim, not the underlying governance capability.

Scalability Assessment
Current Bottlenecks

* Single SQLite writer
* Local database file
* In-process cache and rate-limit state
* Linear in-memory catalogue filtering
* Synchronous score generation at startup
* Synchronous portfolio scoring
* Free-tier cold starts
* Up to approximately 31 seconds for failed Open Food Facts retries
* JSON catalogue deployment model

Future Scaling Risks

* Replicas will have different databases and security state.
* Audit growth has no archival strategy.
* Larger catalogues increase memory and cold-start costs.
* Bulk rescoring can monopolise the Node.js process.
* Manufacturer ingestion will conflict with the release-driven catalogue.
* Third-party outages can consume many open requests.
* Free-tier infrastructure gives no enterprise availability or capacity assurance.

Recommendations

* Move to managed PostgreSQL.
* Use Redis for distributed rate limiting only when multiple instances are introduced.
* Add circuit breaking and concurrency limits around Open Food Facts.
* Move rescoring and ingestion into idempotent background jobs.
* Store product and evidence versions in relational tables.
* Add indexed search and database-backed pagination.
* Define SLOs and perform load, soak, restart and recovery testing.

Business Value Assessment
The platform addresses a credible business problem: manufacturers need structured sustainability evidence, comparison and reporting support.
The strongest business value is likely to come from:

* Evidence ingestion
* Data-quality review
* Provenance and versioning
* Portfolio-level reporting
* Repeatable exports
* Manufacturer collaboration
* Controlled score publication

Further ML complexity is not the priority. A simpler statistical scoring platform with excellent evidence lineage and governance would be more valuable than additional predictive models without trusted source data.
The application should continue to avoid claiming that category-derived estimates are verified product carbon footprints or that generated JSON alone establishes ESPR compliance.

Recommended Improvements
Critical

1. Replace Render-local SQLite with managed PostgreSQL.
2. Implement backup, restore and disaster-recovery testing.
3. Remove JWTs from `localStorage`.
4. Add rotating, revocable authentication sessions.
5. Introduce durable score-input, source, methodology, artefact and code-version records.
6. Add privacy retention, deletion and export controls.
7. Enforce required CI checks before merging to `main`.

Important

1. Move rate limiting and lockout state to a distributed store before scaling.
2. Add real monitoring, alerts, request IDs and service metrics.
3. Correct the Sentry setup: it uses `REACT_APP_SENTRY_DSN`, which Next.js does not expose by default, and `initSentry()` is not visibly invoked.
4. Split liveness and readiness checks and verify exact expected migrations.
5. Add authentication, CSRF, refresh, logout and cross-origin frontend tests.
6. Add load, restart, migration and recovery tests.
7. Introduce a circuit breaker for Open Food Facts.
8. Move catalogue ingestion and rescoring out of the web process.
9. Require security review or documented triage for high-severity dependency findings.

Nice-to-Have

* Consolidate API version routing.
* Replace hostname inference with explicit deployment configuration.
* Pin container images to immutable digests.
* Add architecture decision records.
* Remove generated analysis caches from the main source tree.
* Expand accessibility and browser testing.
* Add cost and third-party latency telemetry.

Final Verdict

* Confidence: High
* Production-readiness score: 6/10
* Classification: Pilot-ready
* Enterprise deployment recommendation: No
* Improvement since previous review: Material but insufficient for production

Would I approve this architecture for enterprise deployment today? Why or why not?
No. I would approve it only for a controlled, non-sensitive pilot where database loss is explicitly acceptable.
The new release demonstrates genuine engineering progress and currently passes CI and live health checks. However, enterprise approval remains blocked by ephemeral SQLite persistence, lack of horizontal scalability, browser-exposed and non-revocable JWTs, process-local security state, inadequate observability and disaster recovery, and governance controls that remain largely application-level rather than tamper-evident and operationally enforced.
