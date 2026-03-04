const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");
const { getDb } = require("../db/schema");
const { generateToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: "Email, name, and password are required" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const sanitizedName = validator.escape(validator.trim(name)).slice(0, 50);
  const sanitizedEmail = validator.normalizeEmail(email);

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(sanitizedEmail);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const id = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);

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
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(validator.normalizeEmail(email));

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

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
