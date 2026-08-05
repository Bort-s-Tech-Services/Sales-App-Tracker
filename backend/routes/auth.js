const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { memoryStore, useMemoryStore, query } = require("../config/db");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

// Register Endpoint
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, company_name } = req.body;

    if (!email || !password || !full_name) {
      return res
        .status(400)
        .json({ error: "Please provide full name, email, and password." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "usr_" + Date.now();

    if (useMemoryStore) {
      const existing = memoryStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (existing) {
        return res
          .status(400)
          .json({ error: "An account with this email already exists." });
      }

      const newUser = {
        id: userId,
        full_name,
        email,
        password_hash: hashedPassword,
        company_name: company_name || "",
        role: "user",
        avatar_s3_url: `https://csbc252-sales-tracker-assets.s3.amazonaws.com/avatars/default.png`,
        created_at: new Date(),
      };
      memoryStore.users.push(newUser);

      const token = jwt.sign(
        { id: userId, email, role: "user", full_name },
        JWT_SECRET,
        { expiresIn: "7d" },
      );
      return res.status(201).json({
        message: "Registration successful",
        token,
        user: { id: userId, full_name, email, company_name },
      });
    }

    // PostgreSQL RDS execution
    const checkRes = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (checkRes.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    await query(
      "INSERT INTO users (id, full_name, email, password_hash, company_name) VALUES ($1, $2, $3, $4, $5)",
      [userId, full_name, email, hashedPassword, company_name || ""],
    );

    const token = jwt.sign(
      { id: userId, email, role: "user", full_name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: userId, full_name, email, company_name },
    });
  } catch (err) {
    console.error("[Auth Register Error]:", err);
    res
      .status(500)
      .json({ error: "Internal server error during registration" });
  }
});

// Login Endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please enter email and password." });
    }

    if (useMemoryStore) {
      const user = memoryStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Check demo password or hash
      const isValid =
        password === "admin123" ||
        (await bcrypt.compare(password, user.password_hash));
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          company_name: user.company_name,
          avatar_s3_url: user.avatar_s3_url,
        },
      });
    }

    const userRes = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = userRes.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        company_name: user.company_name,
        avatar_s3_url: user.avatar_s3_url,
      },
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// Current Authenticated User Info Endpoint
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update Profile Info Endpoint
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, company_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: "Full name is required." });
    }

    if (useMemoryStore) {
      const user = memoryStore.users.find(
        (u) => u.id === userId || u.email === req.user.email,
      );
      if (user) {
        user.full_name = full_name;
        if (company_name !== undefined) user.company_name = company_name;
      }
      return res.json({
        message: "Profile updated successfully",
        user: {
          id: userId,
          full_name,
          email: req.user.email,
          company_name: user ? user.company_name : company_name,
        },
      });
    }

    await query(
      "UPDATE users SET full_name = $1, company_name = $2 WHERE id = $3",
      [full_name, company_name || "", userId],
    );

    res.json({
      message: "Profile updated successfully",
      user: { id: userId, full_name, email: req.user.email, company_name },
    });
  } catch (err) {
    console.error("[Auth Update Profile Error]:", err);
    res.status(500).json({ error: "Failed to update profile details" });
  }
});

// Change Password Endpoint
router.put("/password", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ error: "Please enter current and new passwords." });
    }

    if (new_password.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long." });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    if (useMemoryStore) {
      const user = memoryStore.users.find(
        (u) => u.id === userId || u.email === req.user.email,
      );
      if (user) {
        user.password_hash = hashedPassword;
      }
      return res.json({ message: "Password updated successfully" });
    }

    const userRes = await query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId],
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User account not found" });
    }

    const isValid = await bcrypt.compare(
      current_password,
      userRes.rows[0].password_hash,
    );
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("[Auth Update Password Error]:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

const crypto = require('crypto');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const ses = new SESClient({ region: process.env.AWS_REGION });

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (useMemoryStore) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

      if (!memoryStore.resetTokens) memoryStore.resetTokens = [];
      memoryStore.resetTokens = memoryStore.resetTokens.filter(t => t.userId !== user.id);
      memoryStore.resetTokens.push({ userId: user.id, token, expiresAt, used: false });
    } else {
      const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (userRes.rows.length === 0) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

      const userId = userRes.rows[0].id;
      await query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE', [userId]);
      await query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
    }

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log('[SES] Attempting to send to:', email);
    await ses.send(new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Reset Your Password — Sales Tracker Pro' },
        Body: { Text: { Data: `Reset your password here (This link expires in 15 minutes):\n\n${resetLink}\n\nIgnore this if you didn't request it.` } }
      }
    }));
console.log('[SES] Email sent successfully');
    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Token and new password are required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters long.' });

  try {
    const hashedPassword = await bcrypt.hash(new_password, 10);

    if (useMemoryStore) {
      if (!memoryStore.resetTokens) return res.status(400).json({ error: 'Invalid or expired reset token' });
      const record = memoryStore.resetTokens.find(t => t.token === token && !t.used && new Date() < new Date(t.expiresAt));
      if (!record) return res.status(400).json({ error: 'Invalid or expired reset token' });

      const user = memoryStore.users.find(u => u.id === record.userId);
      if (user) user.password_hash = hashedPassword;
      record.used = true;
    } else {
      const result = await query(
        'SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token = $1',
        [token]
      );
      if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset token' });

      const { id, user_id, expires_at, used } = result.rows[0];
      if (used || new Date() > new Date(expires_at)) return res.status(400).json({ error: 'Invalid or expired reset token' });

      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user_id]);
      await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [id]);
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

// const crypto = require("crypto");
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// const ses = new SESClient({ region: process.env.AWS_REGION });

// // POST /auth/forgot-password
// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Email is required" });

//   try {
//     const userResult = await pool.query(
//       "SELECT id FROM users WHERE email = $1",
//       [email],
//     );

//     // Always respond 200 — don't leak whether email exists
//     if (userResult.rows.length === 0) {
//       return res
//         .status(200)
//         .json({ message: "If that email exists, a reset link has been sent." });
//     }

//     const userId = userResult.rows[0].id;
//     const token = crypto.randomBytes(32).toString("hex");
//     const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

//     // Invalidate any existing tokens for this user
//     await pool.query(
//       "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
//       [userId],
//     );

//     await pool.query(
//       "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
//       [userId, token, expiresAt],
//     );

//     const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

//     const command = new SendEmailCommand({
//       Source: process.env.SES_FROM_EMAIL, // must be verified in SES
//       Destination: { ToAddresses: [email] },
//       Message: {
//         Subject: { Data: "Reset Your Password — Sales Tracker Pro" },
//         Body: {
//           Text: {
//             Data: `Click the link below to reset your password. It expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request this, ignore this email.`,
//           },
//         },
//       },
//     });

//     await ses.send(command);
//     return res
//       .status(200)
//       .json({ message: "If that email exists, a reset link has been sent." });
//   } catch (err) {
//     console.error("Forgot password error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // POST /auth/reset-password
// router.post("/reset-password", async (req, res) => {
//   const { token, newPassword } = req.body;
//   if (!token || !newPassword) {
//     return res
//       .status(400)
//       .json({ message: "Token and new password are required" });
//   }
//   if (newPassword.length < 8) {
//     return res
//       .status(400)
//       .json({ message: "Password must be at least 8 characters" });
//   }

//   try {
//     const result = await pool.query(
//       `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
//        FROM password_reset_tokens prt
//        WHERE prt.token = $1`,
//       [token],
//     );

//     if (result.rows.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired reset token" });
//     }

//     const { id, user_id, expires_at, used } = result.rows[0];

//     if (used || new Date() > new Date(expires_at)) {
//       return res
//         .status(400)
//         .json({ message: "Invalid or expired reset token" });
//     }

//     const bcrypt = require("bcrypt");
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
//       hashedPassword,
//       user_id,
//     ]);
//     await pool.query(
//       "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
//       [id],
//     );

//     res.status(200).json({ message: "Password reset successful" });
//   } catch (err) {
//     console.error("Reset password error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });
