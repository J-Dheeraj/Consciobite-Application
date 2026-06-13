const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  refreshToken,
  generateCsrfToken,
} = require("../middleware/auth");

const router = express.Router();

// ---------- Account lockout after repeated failed logins ----------
// Keyed by email+IP so one attacker from one IP can't lock out a victim
// across the whole internet. Map is capped to prevent unbounded growth from
// attacker-supplied email strings; oldest entries are evicted FIFO.
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TRACKED_KEYS = 10000;

function attemptKey(email, ip) {
  return `${email}|${ip || "unknown"}`;
}

function recordFailedAttempt(email, ip) {
  const key = attemptKey(email, ip);
  const entry = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  if (Date.now() - entry.firstAttempt > LOCKOUT_MS) {
    entry.count = 1;
    entry.firstAttempt = Date.now();
  } else {
    entry.count++;
  }
  loginAttempts.set(key, entry);
  if (loginAttempts.size > MAX_TRACKED_KEYS) {
    const oldest = loginAttempts.keys().next().value;
    loginAttempts.delete(oldest);
  }
}

function isLockedOut(email, ip) {
  const key = attemptKey(email, ip);
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > LOCKOUT_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function clearAttempts(email, ip) {
  loginAttempts.delete(attemptKey(email, ip));
}

// Pre-computed dummy hash used when a login request targets a non-existent
// email. Running bcrypt.compare against this hash equalizes response timing
// so an attacker cannot distinguish "user exists, wrong password" from
// "user does not exist" by measuring latency.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-timing-equalization", 12);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: "Email, name, and password are required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length > 128) {
    return res.status(400).json({ error: "Password must not exceed 128 characters" });
  }

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return res.status(400).json({
      error: "Password must be at least 8 characters with uppercase, lowercase, and a number",
    });
  }

  const sanitizedName = validator.escape(validator.trim(name)).slice(0, 50);
  const sanitizedEmail = validator.normalizeEmail(email);

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(sanitizedEmail);
  if (existing) {
    return res.status(409).json({ error: "Unable to create account" });
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  db.prepare("INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)").run(
    id,
    sanitizedEmail,
    sanitizedName,
    passwordHash
  );

  const user = { id, email: sanitizedEmail, name: sanitizedName };
  const token = generateToken(user);
  setAuthCookie(res, token);

  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = validator.normalizeEmail(email);
  const ip = req.ip;

  if (isLockedOut(normalizedEmail, ip)) {
    return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, password_hash, role FROM users WHERE email = ?")
    .get(normalizedEmail);

  // Always run bcrypt.compare to keep response time constant regardless of
  // whether the email exists - prevents user enumeration via timing.
  const hashToCheck = user ? user.password_hash : DUMMY_PASSWORD_HASH;
  const passwordOk = await bcrypt.compare(password, hashToCheck);

  if (!user || !passwordOk) {
    recordFailedAttempt(normalizedEmail, ip);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  clearAttempts(normalizedEmail, ip);
  const token = generateToken({ id: user.id, email: user.email });
  setAuthCookie(res, token);

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  });
});

// POST /api/auth/logout - clear the auth cookie
router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, role, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user });
});

// POST /api/auth/refresh - refresh an unexpired token
router.post("/refresh", refreshToken);

// GET /api/auth/csrf - get a CSRF token
router.get("/csrf", generateCsrfToken);

module.exports = router;
