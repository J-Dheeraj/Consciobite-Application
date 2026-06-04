const jwt = require("jsonwebtoken");
const crypto = require("crypto");

if (process.env.NODE_ENV !== "test" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const JWT_ALGORITHM = "HS256";
const COOKIE_NAME = "consciobite_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 2 * 60 * 60 * 1000,
};

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role || "user" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = decoded;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { getDb } = require("../db/schema");
  const row = getDb().prepare("SELECT role FROM users WHERE id = ?").get(req.user.id);
  if (!row || row.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    } catch {
      // Invalid token, proceed without auth
    }
  }
  next();
}

function refreshToken(req, res) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      ignoreExpiration: false,
    });
    const newToken = generateToken({ id: decoded.id, email: decoded.email, role: decoded.role });
    setAuthCookie(res, newToken);
    res.json({ token: newToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = req.cookies && req.cookies["csrf-token"];

  if (!headerToken || !cookieToken) {
    return res.status(403).json({ error: "CSRF token missing" });
  }

  if (headerToken.length !== cookieToken.length) {
    return res.status(403).json({ error: "CSRF token mismatch" });
  }

  if (!crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))) {
    return res.status(403).json({ error: "CSRF token mismatch" });
  }

  next();
}

function generateCsrfToken(_req, res) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("csrf-token", token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.json({ csrfToken: token });
}

module.exports = {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireAdmin,
  optionalAuth,
  refreshToken,
  csrfProtection,
  generateCsrfToken,
};
