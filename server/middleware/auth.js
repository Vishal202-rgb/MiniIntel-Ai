const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Authenticate JWT token and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return sendError(res, 'Not authorized, user account not found', 'USER_NOT_FOUND', 401);
      }

      // Check account status
      if (user.status === 'suspended' || user.status === 'inactive') {
        return sendError(res, `Account is ${user.status}. Access denied.`, 'ACCOUNT_INACTIVE', 403);
      }

      // Enforce strict predefined admin identity:
      // Only the designated admin username can possess the 'admin' role.
      const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
      if (user.username === predefinedAdmin) {
        user.role = 'admin';
      } else if (user.role === 'admin') {
        // Prevent unauthorized admin role escalation
        user.role = 'user';
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Authorization token has expired', 'TOKEN_EXPIRED', 401);
      }
      return sendError(res, 'Not authorized, invalid token', 'INVALID_TOKEN', 401);
    }
  }

  return sendError(res, 'Not authorized, no bearer token provided', 'NO_TOKEN', 401);
};

/**
 * Authorize specific roles
 * @param  {...string} allowedRoles - e.g. 'admin', 'reviewer', 'user'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization', 'AUTH_REQUIRED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`,
        'FORBIDDEN_ROLE',
        403
      );
    }

    next();
  };
};

// Aliases for seamless drop-in compatibility with legacy routes
const protect = authenticate;
const admin = authorize('admin');
const reviewer = authorize('admin', 'reviewer');

module.exports = {
  authenticate,
  authorize,
  protect,
  admin,
  reviewer
};
