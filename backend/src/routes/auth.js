const express = require("express");
const router = express.Router();
const pool = require("../services/db");
const { hashPassword } = require("../services/migrate");
const crypto = require("crypto");

// Create token helper
function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    store_name: user.store_name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(token) {
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    const payload = JSON.parse(json);
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, store_name, email, password, phone } = req.body;

    if (!name || !store_name || !email || !password) {
      return res.status(400).json({ error: "Name, store name, email, and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists. Please log in." });
    }

    const passwordHash = hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (name, store_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'owner')
       RETURNING id, name, store_name, email, phone, role, created_at`,
      [name.trim(), store_name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : ""]
    );

    const user = result.rows[0];
    const token = createToken(user);

    return res.status(201).json({
      message: "Registration successful!",
      token,
      user
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Registration failed: " + error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query(
      "SELECT id, name, store_name, email, password_hash, phone, role FROM users WHERE LOWER(email) = $1",
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = result.rows[0];
    const hash = hashPassword(password);

    if (user.password_hash !== hash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    delete user.password_hash;
    const token = createToken(user);

    return res.json({
      message: "Login successful!",
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed: " + error.message });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Default to the first owner for convenience if unauthenticated
      const defaultUser = await pool.query("SELECT id, name, store_name, email, phone, role FROM users ORDER BY id LIMIT 1");
      return res.json({ user: defaultUser.rows[0] || null });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const result = await pool.query(
      "SELECT id, name, store_name, email, phone, role FROM users WHERE id = $1",
      [payload.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Failed to verify session." });
  }
});

module.exports = router;
