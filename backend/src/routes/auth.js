const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { generateToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

// ---------- Account lockout after repeated failed logins ----------
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
  if (Date.now() - entry.firstAttempt > LOCKOUT_MS) {
    entry.count = 1;
    entry.firstAttempt = Date.now();
  } else {
    entry.count++;
  }
  loginAttempts.set(email, entry);
}

function isLockedOut(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > LOCKOUT_MS) {
    loginAttempts.delete(email);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

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

  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = validator.normalizeEmail(email);

  if (isLockedOut(normalizedEmail)) {
    return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    recordFailedAttempt(normalizedEmail);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  clearAttempts(normalizedEmail);
  const token = generateToken({ id: user.id, email: user.email });

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user });
});

module.exports = router;
