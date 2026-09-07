const express = require('express');
const router = express.Router();
const User = require('../../../models/User');
const Document = require('../../../models/Document');
const Report = require('../../../models/Report');
const ValidationResult = require('../../../models/ValidationResult');
const { authenticate, admin } = require('../../../middleware/auth');
const auditService = require('../../../services/auditService');
const { sendSuccess, sendError } = require('../../../utils/apiResponse');

router.get('/users', authenticate, admin, async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    return sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id/role', authenticate, admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);

    if (req.body.role === 'admin') {
      return sendError(res, 'Only predefined admin identity can hold the admin role', 'FORBIDDEN_ROLE_ASSIGNMENT', 403);
    }

    user.role = req.body.role;
    await user.save();
    auditService.logAudit({
      user: req.user._id,
      action: 'CHANGE_USER_ROLE',
      resource: 'User',
      resourceId: user._id,
      details: { newRole: user.role }
    });
    return sendSuccess(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', authenticate, admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'Cannot delete your own admin account', 'SELF_DELETE_FORBIDDEN', 403);
    }

    const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
    if (user.username === predefinedAdmin || user.role === 'admin') {
      return sendError(res, 'Cannot delete an administrator account', 'ADMIN_DELETE_FORBIDDEN', 403);
    }

    await User.findByIdAndDelete(req.params.id);
    auditService.logAudit({
      user: req.user._id,
      action: 'DELETE_USER',
      resource: 'User',
      resourceId: user._id,
      details: { deletedUsername: user.username }
    });

    return sendSuccess(res, { deletedUserId: req.params.id }, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticate, admin, async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const indexedDocuments = await Document.countDocuments({ status: 'completed' });
    const reportsGenerated = await Report.countDocuments();
    const totalValidations = await ValidationResult.countDocuments();
    const openValidations = await ValidationResult.countDocuments({ status: { $ne: 'resolved' } });

    return sendSuccess(res, {
      totalUsers,
      totalDocuments,
      indexedDocuments,
      reportsGenerated,
      totalValidations,
      openValidations
    }, 'Admin statistics retrieved');
  } catch (error) {
    next(error);
  }
});

router.get('/system-health', authenticate, admin, async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

    return sendSuccess(res, {
      backend: 'Online',
      mongoDB: mongoStatus,
      aiProvider: 'Online',
      vectorDB: 'Online'
    }, 'System health status retrieved');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
