const { logger } = require("./middleware/logger");

const ENV = process.env.NODE_ENV || "development";

const CONFIG = {
  env: ENV,
  port: parseInt(process.env.PORT, 10) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000"],
  dbPath: process.env.DB_PATH,
  logLevel: process.env.LOG_LEVEL || "info",
};

function validateConfig() {
  const errors = [];

  if (ENV === "production") {
    if (!CONFIG.jwtSecret) errors.push("JWT_SECRET is required in production");
    if (CONFIG.jwtSecret && CONFIG.jwtSecret.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters");
    }
    if (CONFIG.allowedOrigins.includes("http://localhost:3000")) {
      logger.warn("ALLOWED_ORIGINS includes localhost — ensure this is intentional in production");
    }
  }

  if (CONFIG.port < 1 || CONFIG.port > 65535) {
    errors.push(`Invalid PORT: ${CONFIG.port}`);
  }

  if (errors.length > 0) {
    for (const err of errors) {
      logger.error(`Config error: ${err}`);
    }
    if (ENV === "production") {
      process.exit(1);
    }
  }

  logger.info(`Config validated (env=${ENV}, port=${CONFIG.port})`);
}

module.exports = { CONFIG, validateConfig };
