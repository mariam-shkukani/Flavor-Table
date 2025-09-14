const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function queryDB(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Middleware للتحقق من JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// =====================
// Register
// =====================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const existing = await queryDB('SELECT * FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (existing.length) return res.status(400).json({ error: 'Username or email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const rows = await queryDB(
      `INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING id, username, email`,
      [username, email, hashed]
    );
    res.status(201).json({ message: 'User registered', user: rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// =====================
// Login
// =====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });

    const users = await queryDB('SELECT * FROM users WHERE email=$1', [email]);
    if (!users.length) return res.status(400).json({ error: 'Invalid credentials' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// =====================
// Get Profile (Protected)
// =====================
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const users = await queryDB('SELECT id, username, email FROM users WHERE id=$1', [req.user.id]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;