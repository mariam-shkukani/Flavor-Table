const express = require('express');
const router = express.Router();
const db = require('../public/db');
const { Pool } = require('pg');

const verifyToken = require('../middleware/verifyToken');
const bcrypt = require('bcrypt');

// الحصول على بيانات المستخدم (محمي)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, email FROM users WHERE id=$1', [req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// تعديل بيانات المستخدم (username/email)
router.put('/profile', verifyToken, async (req, res) => {
  const { username, email } = req.body;
  try {
    await db.query('UPDATE users SET username=$1, email=$2 WHERE id=$3', [username, email, req.user.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// تغيير كلمة السر
router.put('/password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await db.query('SELECT password FROM users WHERE id=$1', [req.user.id]);
    const user = result.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Current password incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password=$1 WHERE id=$2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
