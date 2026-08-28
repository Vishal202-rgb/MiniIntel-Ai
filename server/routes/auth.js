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
  const user = await User.findOne({ username });
  
  const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
  const isAdminIdentity = username === predefinedAdmin;

  let isAuthenticated = false;

  if (isAdminIdentity) {
    // STRICT VERIFICATION: Verify admin secret directly from environment variable
    // This prevents DB tampering (changing admin hash) from allowing unauthorized access
    const expectedAdminPassword = process.env.ADMIN_PASSWORD;
    if (!expectedAdminPassword) {
      console.error('CRITICAL: ADMIN_PASSWORD environment variable is missing.');
    } else {
      isAuthenticated = (password === expectedAdminPassword);
    }
  } else {
    // Normal user verification via database hash
    if (user && (await user.matchPassword(password))) {
      isAuthenticated = true;
    }
  }

  if (user && isAuthenticated) {
    
    // STRICT RBAC: Enforce predefined admin identity
    let actualRole = user.username === predefinedAdmin ? 'admin' : 'user';

    // Sync database if it was tampered with or out of sync
    if (user.role !== actualRole) {
      user.role = actualRole;
      await user.save();
    }

    auditService.logAudit({ user: user._id, action: 'USER_LOGIN', resource: 'Auth' });
    res.json({
      _id: user._id,
      username: user.username,
      role: actualRole,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
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
