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
  if (user && (await user.matchPassword(password))) {
    auditService.logAudit({ user: user._id, action: 'USER_LOGIN', resource: 'Auth' });
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const userCount = await User.countDocuments();
  const assignedRole = userCount === 0 ? 'admin' : (role || 'user');
  const user = await User.create({ username, password, role: assignedRole });
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
