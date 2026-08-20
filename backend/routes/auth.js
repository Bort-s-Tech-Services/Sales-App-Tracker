const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { memoryStore, useMemoryStore, query } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register Endpoint
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, company_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now();

    if (useMemoryStore) {
      const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const newUser = {
        id: userId,
        full_name,
        email,
        password_hash: hashedPassword,
        company_name: company_name || '',
        role: 'user',
        avatar_s3_url: `https://csbc252-sales-tracker-assets.s3.amazonaws.com/avatars/default.png`,
        created_at: new Date()
      };
      memoryStore.users.push(newUser);

      const token = jwt.sign({ id: userId, email, role: 'user', full_name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: userId, full_name, email, company_name }
      });
    }

    // PostgreSQL RDS execution
    const checkRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    await query(
      'INSERT INTO users (id, full_name, email, password_hash, company_name) VALUES ($1, $2, $3, $4, $5)',
      [userId, full_name, email, hashedPassword, company_name || '']
    );

    const token = jwt.sign({ id: userId, email, role: 'user', full_name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, full_name, email, company_name }
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter email and password.' });
    }

    if (useMemoryStore) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Check demo password or hash
      const isValid = password === 'admin1234567890' || (await bcrypt.compare(password, user.password_hash));
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          company_name: user.company_name,
          avatar_s3_url: user.avatar_s3_url
        }
      });
    }

    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        company_name: user.company_name,
        avatar_s3_url: user.avatar_s3_url
      }
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Current Authenticated User Info Endpoint
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update Profile Info Endpoint
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, company_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (useMemoryStore) {
      const user = memoryStore.users.find(u => u.id === userId || u.email === req.user.email);
      if (user) {
        user.full_name = full_name;
        if (company_name !== undefined) user.company_name = company_name;
      }
      return res.json({
        message: 'Profile updated successfully',
        user: { id: userId, full_name, email: req.user.email, company_name: user ? user.company_name : company_name }
      });
    }

    await query(
      'UPDATE users SET full_name = $1, company_name = $2 WHERE id = $3',
      [full_name, company_name || '', userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: { id: userId, full_name, email: req.user.email, company_name }
    });
  } catch (err) {
    console.error('[Auth Update Profile Error]:', err);
    res.status(500).json({ error: 'Failed to update profile details' });
  }
});

// Change Password Endpoint
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Please enter current and new passwords.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    if (useMemoryStore) {
      const user = memoryStore.users.find(u => u.id === userId || u.email === req.user.email);
      if (user) {
        user.password_hash = hashedPassword;
      }
      return res.json({ message: 'Password updated successfully' });
    }

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const isValid = await bcrypt.compare(current_password, userRes.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Auth Update Password Error]:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;

