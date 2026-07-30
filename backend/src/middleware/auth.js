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
  return jwt.sign({ id: user.id, email: user.email, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
}

// Issue a token plus its expiry (ms epoch) so clients can schedule refresh
// without decoding the JWT themselves.
function issueToken(user) {
  const token = generateToken(user);
  const { exp } = jwt.decode(token);
  return { token, expiresAt: exp * 1000 };
}

// ---------- Revocation registry ----------
// Tokens carry a jti; logout writes the jti to revoked_tokens so a stolen
// copy dies immediately instead of living until natural expiry. Expired rows
// are purged lazily on each write.

function getDbLazy() {
  // Lazy require avoids a schema.js <-> middleware require cycle at load time
  const { getDb } = require("../db/schema");
  return getDb();
}

function revokeToken(decoded) {
  if (!decoded || !decoded.jti || !decoded.exp) return;
  const db = getDbLazy();
  db.prepare("DELETE FROM revoked_tokens WHERE expires_at < ?").run(Math.floor(Date.now() / 1000));
  db.prepare(
    "INSERT OR IGNORE INTO revoked_tokens (jti, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(decoded.jti, decoded.id ?? null, decoded.exp);
}

function isRevoked(decoded) {
  if (!decoded || !decoded.jti) return false;
  const row = getDbLazy().prepare("SELECT 1 FROM revoked_tokens WHERE jti = ?").get(decoded.jti);
  return row !== undefined;
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

function verifyActiveToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
  if (isRevoked(decoded)) {
    const err = new Error("Token revoked");
    err.revoked = true;
    throw err;
  }
  return decoded;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = verifyActiveToken(token);
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
    req.user = verifyActiveToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const row = getDbLazy().prepare("SELECT role FROM users WHERE id = ?").get(req.user.id);
  if (!row || row.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyActiveToken(token);
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
    const decoded = verifyActiveToken(token);
    const issued = issueToken({ id: decoded.id, email: decoded.email });
    setAuthCookie(res, issued.token);
    res.json(issued);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Revoke the presented token (if any) and clear the cookie. Idempotent:
// succeeds even when no valid token is presented.
function logoutHandler(req, res) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
      revokeToken(decoded);
    } catch {
      // Expired or invalid token: nothing to revoke
    }
  }
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
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
  issueToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  requireAdmin,
  optionalAuth,
  refreshToken,
  logoutHandler,
  csrfProtection,
  generateCsrfToken,
};
