const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const { authenticate } = require('../../../middleware/auth');
const validate = require('../../../validators/validate');
const {
  validateLogin,
  validateRegister,
  validateProfileUpdate,
  validateChangePassword
} = require('../../../validators/authValidator');
const auditService = require('../../../services/auditService');
const { sendSuccess, sendError } = require('../../../utils/apiResponse');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new standard user
 * @access  Public
 */
router.post('/register', validate(validateRegister), async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';

    if (username.trim().toLowerCase() === predefinedAdmin.toLowerCase()) {
      return sendError(res, 'This identity is reserved and cannot be registered publicly.', 'FORBIDDEN_IDENTITY', 403);
    }

    const userExists = await User.findOne({ username: username.trim() });
    if (userExists) {
      return sendError(res, 'User with this username already exists', 'USER_EXISTS', 400);
    }

    if (email && email.trim()) {
      const emailExists = await User.findOne({ email: email.trim() });
      if (emailExists) {
        return sendError(res, 'User with this email already exists', 'EMAIL_EXISTS', 400);
      }
    }

    const user = await User.create({
      username: username.trim(),
      email: email ? email.trim() : undefined,
      password,
      role: 'user',
      status: 'active'
    });

    auditService.logAudit({
      user: user._id,
      action: 'USER_REGISTER',
      resource: 'Auth',
      details: { role: 'user', username: user.username }
    });

    return sendSuccess(res, {
      _id: user._id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      token: generateToken(user._id)
    }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get token (supports admin auto-provisioning)
 * @access  Public
 */
router.post('/login', validate(validateLogin), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = username.trim();
    const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
    const isAdminIdentity = cleanUsername === predefinedAdmin;

    // --- Admin authentication path ---
    if (isAdminIdentity) {
      const expectedAdminPassword = process.env.ADMIN_PASSWORD;
      if (!expectedAdminPassword) {
        return sendError(res, 'Admin configuration error. Contact system administrator.', 'CONFIG_ERROR', 500);
      }

      if (password !== expectedAdminPassword) {
        return sendError(res, 'Invalid admin credentials', 'INVALID_CREDENTIALS', 401);
      }

      let user = await User.findOne({ username: predefinedAdmin });
      if (!user) {
        user = await User.create({
          username: predefinedAdmin,
          password: password,
          role: 'admin',
          status: 'active'
        });
      }

      if (user.role !== 'admin') {
        user.role = 'admin';
      }
      user.lastLogin = new Date();
      await user.save();

      auditService.logAudit({ user: user._id, action: 'ADMIN_LOGIN', resource: 'Auth' });

      return sendSuccess(res, {
        _id: user._id,
        username: user.username,
        role: 'admin',
        token: generateToken(user._id)
      }, 'Admin authentication successful');
    }

    // --- Normal user path ---
    const user = await User.findOne({ username: cleanUsername });
    if (!user || !(await user.matchPassword(password))) {
      return sendError(res, 'Invalid username or password', 'INVALID_CREDENTIALS', 401);
    }

    // Account status check
    if (user.status === 'suspended' || user.status === 'inactive') {
      return sendError(res, `Account is ${user.status}. Contact system administrator.`, 'ACCOUNT_INACTIVE', 403);
    }

    // Enforce admin identity isolation
    if (user.role === 'admin') {
      user.role = 'user';
    }

    user.lastLogin = new Date();
    await user.save();

    auditService.logAudit({ user: user._id, action: 'USER_LOGIN', resource: 'Auth' });

    return sendSuccess(res, {
      _id: user._id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      token: generateToken(user._id)
    }, 'User authentication successful');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out user session & record audit event
 * @access  Public (Optional Bearer token for audit attribution)
 */
router.post('/logout', async (req, res, next) => {
  try {
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.id;
      } catch (err) {
        // Token expired or invalid, logout still proceeds cleanly
      }
    }

    if (userId) {
      auditService.logAudit({
        user: userId,
        action: 'USER_LOGOUT',
        resource: 'Auth'
      });
    }

    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user identity
 * @access  Private
 */
router.get('/me', authenticate, (req, res) => {
  return sendSuccess(res, {
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email || '',
    role: req.user.role,
    department: req.user.department || '',
    status: req.user.status || 'active',
    lastLogin: req.user.lastLogin || null,
    createdAt: req.user.createdAt
  }, 'User profile retrieved');
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile fields (email, department)
 * @access  Private
 */
router.put('/profile', authenticate, validate(validateProfileUpdate), async (req, res, next) => {
  try {
    const { email, department } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    // Email update with uniqueness verification
    if (email !== undefined) {
      const cleanEmail = email.trim();
      if (cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existing) {
          return sendError(res, 'This email address is already in use by another account', 'EMAIL_IN_USE', 400);
        }
        user.email = cleanEmail;
      }
    }

    // Department update
    if (department !== undefined) {
      user.department = department.trim();
    }

    await user.save();

    auditService.logAudit({
      user: user._id,
      action: 'UPDATE_PROFILE',
      resource: 'Auth',
      details: { email: user.email, department: user.department }
    });

    return sendSuccess(res, {
      _id: user._id,
      username: user.username,
      email: user.email || '',
      department: user.department || '',
      role: user.role,
      status: user.status
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change authenticated user password
 * @access  Private
 */
router.put('/change-password', authenticate, validate(validateChangePassword), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
    const isAdminIdentity = user.username === predefinedAdmin;

    // Verify current password
    if (isAdminIdentity) {
      const expectedAdminPassword = process.env.ADMIN_PASSWORD;
      const isMatch = (expectedAdminPassword && currentPassword === expectedAdminPassword) || (await user.matchPassword(currentPassword));
      if (!isMatch) {
        return sendError(res, 'Current admin password is incorrect', 'INVALID_PASSWORD', 401);
      }
    } else {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return sendError(res, 'Current password is incorrect', 'INVALID_PASSWORD', 401);
      }
    }

    // Assign new password (hashed by User pre-save hook)
    user.password = newPassword;
    await user.save();

    auditService.logAudit({
      user: user._id,
      action: 'CHANGE_PASSWORD',
      resource: 'Auth'
    });

    return sendSuccess(res, {}, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh authorization token
 * @access  Public (Token from Bearer header or request body)
 */
router.post('/refresh', async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return sendError(res, 'Token is required for refresh', 'NO_TOKEN', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Token expired, please log in again', 'TOKEN_EXPIRED', 401);
      }
      return sendError(res, 'Invalid token provided for refresh', 'INVALID_TOKEN', 401);
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 'User associated with token no longer exists', 'USER_NOT_FOUND', 401);
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      return sendError(res, `Account is ${user.status}. Access denied.`, 'ACCOUNT_INACTIVE', 403);
    }

    const newToken = generateToken(user._id);

    return sendSuccess(res, {
      token: newToken,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
