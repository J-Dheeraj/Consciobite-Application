const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const productRoutes = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Security headers (Helmet) ----------
// Sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
// X-XSS-Protection, Content-Security-Policy, and more.
app.use(helmet());

// ---------- CORS ----------
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86400, // Cache preflight for 24h
  })
);

// ---------- Rate limiting ----------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

// Stricter limit for barcode scan (prevents brute-force enumeration)
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many scan requests, please try again later." },
});
app.use("/api/products/scan", scanLimiter);

// ---------- Body parsing with size limits ----------
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ---------- HTTP parameter pollution protection ----------
app.use(hpp());

// ---------- Disable X-Powered-By (defense in depth, also done by helmet) ----------
app.disable("x-powered-by");

// ---------- Routes ----------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Consciobite API" });
});

app.use("/api/products", productRoutes);

// ---------- 404 handler ----------
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---------- Global error handler (no stack leaks) ----------
app.use((err, _req, res, _next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy: origin not allowed" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Consciobite API running on port ${PORT}`);
});
