const jwt = require("jsonwebtoken");
const crypto = require("crypto");

if (process.env.NODE_ENV !== "test" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const JWT_ALGORITHM = "HS256";

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    } catch {
      // Invalid token, proceed without auth
    }
  }
  next();
}

function refreshToken(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      ignoreExpiration: false,
    });
    const newToken = generateToken({ id: decoded.id, email: decoded.email });
    res.json({ token: newToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const headerToken = req.headers["x-csrf-token"];
  const cookieToken = req.cookies && req.cookies["csrf-token"];

  if (!headerToken || !cookieToken) {
    return res.status(403).json({ error: "CSRF token missing" });
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

module.exports = { generateToken, requireAuth, optionalAuth, refreshToken, csrfProtection, generateCsrfToken };
