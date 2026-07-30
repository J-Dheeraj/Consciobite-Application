const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const {
  issueToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  refreshToken,
  logoutHandler,
  generateCsrfToken,
  csrfProtection,
} = require("../middleware/auth");
const { validate } = require("../middleware/validate");

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
  const { token, expiresAt } = issueToken(user);
  setAuthCookie(res, token);

  res.status(201).json({ user, token, expiresAt });
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
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
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
  const { token, expiresAt } = issueToken({ id: user.id, email: user.email });
  setAuthCookie(res, token);

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
    expiresAt,
  });
});

// POST /api/auth/logout - revoke the presented token and clear the cookie
router.post("/logout", logoutHandler);

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, weekly_carbon_goal, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      weeklyGoal: user.weekly_carbon_goal ?? 10,
      createdAt: user.created_at,
    },
  });
});

const PATCH_ME_SCHEMA = {
  body: {
    name: { required: false, type: "string", minLength: 1, maxLength: 50 },
    weeklyGoal: { required: false, type: "number", min: 1, max: 200 },
  },
};

// PATCH /api/auth/me - update name and/or weekly carbon goal
router.patch("/me", csrfProtection, requireAuth, validate(PATCH_ME_SCHEMA), (req, res) => {
  const { name, weeklyGoal } = req.body;

  if (name === undefined && weeklyGoal === undefined) {
    return res
      .status(400)
      .json({ error: "Provide at least one field to update (name, weeklyGoal)" });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id, email, name, weekly_carbon_goal, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!existing) {
    return res.status(404).json({ error: "User not found" });
  }

  const newName =
    name !== undefined ? validator.escape(validator.trim(name)).slice(0, 50) : existing.name;
  const newGoal = weeklyGoal !== undefined ? weeklyGoal : (existing.weekly_carbon_goal ?? 10);

  db.prepare("UPDATE users SET name = ?, weekly_carbon_goal = ? WHERE id = ?").run(
    newName,
    newGoal,
    req.user.id
  );

  res.json({
    user: {
      id: existing.id,
      email: existing.email,
      name: newName,
      weeklyGoal: newGoal,
      createdAt: existing.created_at,
    },
  });
});

// POST /api/auth/refresh - refresh an unexpired token
router.post("/refresh", refreshToken);

// GET /api/auth/csrf - get a CSRF token
router.get("/csrf", generateCsrfToken);

// GET /api/auth/export - full export of the user's stored data (data portability)
router.get("/export", requireAuth, (req, res) => {
  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, weekly_carbon_goal, created_at FROM users WHERE id = ?")
    .get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const reviews = db
    .prepare("SELECT id, product_id, rating, comment, created_at FROM reviews WHERE user_id = ?")
    .all(req.user.id);
  const carbonLogs = db
    .prepare(
      "SELECT id, product_id, product_name, quantity, emissions, logged_at FROM carbon_logs WHERE user_id = ?"
    )
    .all(req.user.id);

  res.json({
    exported_at: new Date().toISOString(),
    user,
    reviews,
    carbon_logs: carbonLogs,
  });
});

// DELETE /api/auth/account - permanently delete the account and all its data.
// Requires the current password as confirmation.
router.delete("/account", requireAuth, async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "Password confirmation is required" });
  }

  const db = getDb();
  const user = db.prepare("SELECT id, password_hash FROM users WHERE id = ?").get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const deleteAll = db.transaction((userId) => {
    db.prepare("DELETE FROM reviews WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM carbon_logs WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM revoked_tokens WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });
  deleteAll(req.user.id);

  clearAuthCookie(res);
  res.json({ message: "Account and all associated data deleted" });
});

module.exports = router;
