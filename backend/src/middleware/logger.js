const winston = require("winston");
const crypto = require("crypto");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "test" ? "error" : process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple())
  ),
  defaultMeta: { service: "consciobite-api", env: process.env.NODE_ENV || "development" },
  transports: [new winston.transports.Console()],
});

function requestLogger(req, res, next) {
  const start = Date.now();
  // Honor an inbound X-Request-Id (from a proxy or client), otherwise mint
  // one, so a request can be traced across log lines and returned responses.
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      requestId,
    });
  });
  next();
}

module.exports = { logger, requestLogger };
