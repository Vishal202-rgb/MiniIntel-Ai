const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // ── Safe debug logs (never print actual secrets) ──
  console.log('[AUTH DEBUG] ADMIN_USERNAME loaded:', !!process.env.ADMIN_USERNAME);
  console.log('[AUTH DEBUG] ADMIN_PASSWORD loaded:', !!process.env.ADMIN_PASSWORD);
  console.log('[AUTH DEBUG] JWT_SECRET loaded:', !!process.env.JWT_SECRET);
  console.log('[AUTH DEBUG] Login attempt for:', username);

  const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
  const isAdminIdentity = username === predefinedAdmin;

  // ─── ADMIN authentication path ───────────────────────────────────────
  if (isAdminIdentity) {
    const expectedAdminPassword = process.env.ADMIN_PASSWORD;
    if (!expectedAdminPassword) {
      console.error('[AUTH] CRITICAL: ADMIN_PASSWORD environment variable is missing.');
      return res.status(401).json({ message: 'Admin configuration error. Contact system administrator.' });
    }

    if (password !== expectedAdminPassword) {
      console.log('[AUTH DEBUG] Admin password mismatch');
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Admin credentials verified against env vars — now ensure DB record exists
    let user = await User.findOne({ username: predefinedAdmin });

    if (!user) {
      // Auto-provision the admin user on first successful login
      console.log('[AUTH] Auto-provisioning admin user in MongoDB...');
      user = await User.create({
        username: predefinedAdmin,
        password: password,  // Will be hashed by the pre-save hook
        role: 'admin',
        status: 'active'
      });
      console.log('[AUTH] Admin user created successfully');
    }

    // Always enforce admin role in DB
    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    auditService.logAudit({ user: user._id, action: 'ADMIN_LOGIN', resource: 'Auth' });
    return res.json({
      _id: user._id,
      username: user.username,
      role: 'admin',
      token: generateToken(user._id)
    });
  }

  // ─── NORMAL USER authentication path ─────────────────────────────────
  const user = await User.findOne({ username });
  if (user && (await user.matchPassword(password))) {
    // Force role to 'user' for non-admin identities
    if (user.role !== 'user') {
      user.role = 'user';
      await user.save();
    }

    auditService.logAudit({ user: user._id, action: 'USER_LOGIN', resource: 'Auth' });
    return res.json({
      _id: user._id,
      username: user.username,
      role: 'user',
      token: generateToken(user._id)
    });
  }

  res.status(401).json({ message: 'Invalid username or password' });
});

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  // STRICT RBAC: Prevent squatting the predefined admin identity
  const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
  if (username === predefinedAdmin) {
    return res.status(403).json({ message: 'This identity is reserved and cannot be registered publicly.' });
  }

  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // ALWAYS force role to 'user' for public registration. 
  // Initial admin must be created via seed script/env vars.
  const assignedRole = 'user';
  
  const user = await User.create({ username, email, password, role: assignedRole });
  if (user) {
    auditService.logAudit({ user: user._id, action: 'USER_REGISTER', resource: 'Auth', details: { role: assignedRole } });
    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    role: req.user.role
  });
});

module.exports = router;
