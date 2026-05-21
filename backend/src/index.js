const express = require("express");
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
const { requestLogger, logger } = require("./middleware/logger");
const { cacheMiddleware } = require("./middleware/cache");
const { csrfProtection } = require("./middleware/auth");
const { swaggerSpec } = require("./swagger");
const { getDb, closeDb } = require("./db/schema");
const { runMigrations } = require("./db/migrate");
const { CONFIG, validateConfig } = require("./config");
const { trainModel, calculateGreenGrade } = require("./services/greengrade");
const { getMethodology } = require("./services/dataProvenance");
const { snapshotScores } = require("./services/scoreAudit");
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

// ---------- Validate configuration ----------
validateConfig();

// ---------- Initialize database ----------
getDb();
runMigrations();
logger.info("Database initialized");

// ---------- Train GreenGrade ML model on product catalog ----------
trainModel(products);
logger.info(`GreenGrade model trained on ${products.length} products`);

// Snapshot scores on startup to detect future changes
const scoreChanges = snapshotScores(products, (product) =>
  calculateGreenGrade(product.emissions, product.category, product)
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
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Consciobite API", version: "2.0.0", apiVersion: "v1" });
});

app.get("/api/methodology", (_req, res) => {
  res.json(getMethodology());
});

app.use("/api/products", cacheMiddleware(120), productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", csrfProtection, reviewRoutes);
app.use("/api/carbon", csrfProtection, carbonRoutes);
app.use("/api/recipes", cacheMiddleware(600), recipeRoutes);
app.use("/api/admin", csrfProtection, adminRoutes);

// Versioned aliases (v1 = current)
app.use("/api/v1/products", cacheMiddleware(120), productRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/reviews", csrfProtection, reviewRoutes);
app.use("/api/v1/carbon", csrfProtection, carbonRoutes);
app.use("/api/v1/recipes", cacheMiddleware(600), recipeRoutes);

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
