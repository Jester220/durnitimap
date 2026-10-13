const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const errors = {};
    if (name.length < 2 || name.length > 100) {
      errors.name = "Name must be 2 to 100 characters";
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 150) {
      errors.email = "Enter a valid email address";
    }
    if (password.length < 8 || password.length > 72) {
      errors.password = "Password must be 8 to 72 characters";
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Please fix the errors", errors });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email, role: "user" };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Please fix the errors", errors: { email: "This email is already registered" } });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
      [email]
    );

    const invalid = { message: "Invalid email or password" };
    if (rows.length === 0) return res.status(401).json(invalid);

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json(invalid);

    const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
    res.json({ token: makeToken(user), user });
  } catch (err) {
    next(err);
  }
}


async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };