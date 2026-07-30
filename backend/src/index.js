const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const swaggerUi = require("swagger-ui-express");
const productRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const reviewRoutes = require("./routes/reviews");
const carbonRoutes = require("./routes/carbon");
const recipeRoutes = require("./routes/recipes");
const adminRoutes = require("./routes/admin");
const passportRoutes = require("./routes/passport");
const mlRoutes = require("./routes/ml");
const favoritesRoutes = require("./routes/favorites");
const { requestLogger, logger } = require("./middleware/logger");
const { cacheMiddleware } = require("./middleware/cache");
const { csrfProtection } = require("./middleware/auth");
const { swaggerSpec } = require("./swagger");
const { getDb, closeDb } = require("./db/schema");
const { runMigrations } = require("./db/migrate");
const { CONFIG, validateConfig } = require("./config");
const { trainModel, calculateGreenGrade } = require("./services/greengrade");
const mlInsights = require("./services/mlInsights");
const { getMethodology } = require("./services/dataProvenance");
const { snapshotScores, getConflictStats } = require("./services/scoreAudit");
const products = require("./data/products.json");

const DEFAULT_PORT = 4000;
const REQUIRED_EMISSION_KEYS = [
  "landUseChange",
  "animalFeed",
  "farm",
  "processing",
  "transport",
  "packaging",
  "retail",
];

function validateProductCatalog(catalog) {
  if (!Array.isArray(catalog)) {
    throw new Error("products.json: root must be an array");
  }
  for (const p of catalog) {
    if (!p || typeof p !== "object") {
      throw new Error("products.json: entry is not an object");
    }
    if (!p.id || !p.name || !p.category || typeof p.emissions !== "object") {
      throw new Error(`products.json: entry missing required field (id=${p.id ?? "?"})`);
    }
    for (const key of REQUIRED_EMISSION_KEYS) {
      if (typeof p.emissions[key] !== "number") {
        throw new Error(`products.json: product ${p.id} emissions.${key} must be a number`);
      }
    }
  }
}

validateProductCatalog(products);

const app = express();
const PORT = CONFIG.port;

// Behind Render's proxy: trust the first hop so rate limiting and account
// lockout key on the real client IP from X-Forwarded-For, not the proxy IP.
app.set("trust proxy", 1);

// ---------- Validate configuration ----------
validateConfig();

// ---------- Initialize database ----------
getDb();
runMigrations();
logger.info("Database initialized");

// ---------- Train GreenGrade ML model on product catalog ----------
trainModel(products);
logger.info(`GreenGrade model trained on ${products.length} products`);

// Load offline-trained ML artifacts (scikit-learn export) for /api/v1/ml routes
if (mlInsights.loadArtifacts()) {
  logger.info("ML insights artifacts loaded");
}

// Snapshot scores on startup to detect future changes
const scoreChanges = snapshotScores(
  products,
  (product) => calculateGreenGrade(product.emissions, product.category, product),
  { changedBy: "system:startup", changeReason: "Score drift detected at startup snapshot" }
);
if (scoreChanges.length > 0) {
  logger.warn(`Score audit: ${scoreChanges.length} score change(s) detected on startup`);
}

// ---------- Structured logging ----------
app.use(requestLogger);

// ---------- Security headers (Helmet) ----------
app.use(helmet());

// ---------- CORS ----------
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

const ALLOWED_ORIGIN_PATTERN = process.env.ALLOWED_ORIGIN_PATTERN
  ? new RegExp(process.env.ALLOWED_ORIGIN_PATTERN)
  : /^consciobite-(app|api)\.onrender\.com$/;

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (ALLOWED_ORIGIN_PATTERN.test(url.hostname)) {
      return true;
    }
  } catch (_) {
    /* invalid URL, reject */
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    maxAge: 86400,
  })
);

// ---------- Rate limiting ----------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many scan requests, please try again later." },
});
app.use("/api/products/scan", scanLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
  // Same test-env carve-out csrfProtection uses; production limits unchanged.
  skip: () => process.env.NODE_ENV === "test",
});
app.use("/api/auth", authLimiter);

// ---------- Cookie parsing ----------
app.use(cookieParser());

// ---------- Body parsing ----------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ---------- JSON parse error handler ----------
app.use((err, _req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next(err);
});

// ---------- HTTP parameter pollution protection ----------
app.use(hpp());

// ---------- Disable X-Powered-By ----------
app.disable("x-powered-by");

// ---------- API Documentation ----------
if (process.env.NODE_ENV !== "production") {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Consciobite API Docs",
    })
  );
}

// ---------- Routes (v1) ----------

// Liveness: process is up and the event loop responds. No dependency checks —
// use /api/health for readiness.
app.get("/api/health/live", (_req, res) => {
  res.json({ status: "alive" });
});

// Every migration file that must be applied for this build to be considered
// ready, resolved once at startup.
const EXPECTED_MIGRATIONS = fs
  .readdirSync(path.join(__dirname, "db", "migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();

app.get("/api/health", (_req, res) => {
  const checks = {
    database: false,
    migrations: false,
    greengradeModel: false,
    mlArtifacts: mlInsights.isReady(),
  };

  try {
    const db = getDb();
    // BEGIN IMMEDIATE acquires the write lock, verifying the DB is writable
    // (not just readable) without persisting anything.
    db.exec("BEGIN IMMEDIATE; ROLLBACK;");
    checks.database = true;
    const applied = new Set(
      db
        .prepare("SELECT name FROM _migrations")
        .all()
        .map((r) => r.name)
    );
    checks.migrations = EXPECTED_MIGRATIONS.every((name) => applied.has(name));
  } catch (_) {
    // leave database/migrations false
  }

  try {
    calculateGreenGrade(products[0].emissions, products[0].category, products[0]);
    checks.greengradeModel = true;
  } catch (_) {
    // leave greengradeModel false
  }

  // mlArtifacts is advisory-only and does not gate overall health.
  const healthy = checks.database && checks.migrations && checks.greengradeModel;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    service: "Consciobite API",
    version: "2.0.0",
    apiVersion: "v1",
    checks,
  });
});

app.get("/api/methodology", (_req, res) => {
  res.json(getMethodology());
});

app.get("/api/transparency/stats", cacheMiddleware(300), (_req, res) => {
  const stats = getConflictStats();
  const db = getDb();
  const productCount = products.length;
  const manufacturerCount = db.prepare("SELECT COUNT(*) as c FROM manufacturers").get().c;
  const payingCount = db
    .prepare("SELECT COUNT(*) as c FROM manufacturers WHERE is_paying = 1")
    .get().c;
  res.json({ ...stats, productCount, manufacturerCount, payingCount });
});

// Each domain router is mounted at both /api (unversioned, current) and
// /api/v1 (versioned alias) from a single table so the two surfaces cannot
// drift apart.
const ROUTE_TABLE = [
  ["/products", [cacheMiddleware(120)], productRoutes],
  ["/auth", [], authRoutes],
  ["/reviews", [csrfProtection], reviewRoutes],
  ["/carbon", [csrfProtection], carbonRoutes],
  ["/recipes", [cacheMiddleware(600)], recipeRoutes],
  ["/admin", [csrfProtection], adminRoutes],
  ["/favorites", [csrfProtection], favoritesRoutes],
];
for (const [route, middlewares, router] of ROUTE_TABLE) {
  for (const prefix of ["/api", "/api/v1"]) {
    app.use(prefix + route, ...middlewares, router);
  }
}

// v1-only surfaces: ML insights and the Digital Product Passport routes.
// The bare /api/v1 passport mount comes last so more specific /api/v1/*
// mounts above match first.
app.use("/api/v1/ml", cacheMiddleware(120), mlRoutes);
app.use("/api/v1", cacheMiddleware(120), passportRoutes);

// ---------- 404 handler ----------
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---------- Global error handler ----------
app.use((err, _req, res, _next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy: origin not allowed" });
  }

  // Handle operational errors (AppError instances)
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------- Graceful shutdown ----------
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, closing database...");
  closeDb();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, closing database...");
  closeDb();
  process.exit(0);
});

// ---------- Export for testing ----------
if (process.env.NODE_ENV === "test") {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    logger.info(`Consciobite API v2.0 running on port ${PORT}`);
    logger.info(`API Docs: http://localhost:${PORT}/api/docs`);
  });
}
