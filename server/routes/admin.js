const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Document = require('../models/Document');
const Report = require('../models/Report');
const ValidationResult = require('../models/ValidationResult');
const { protect, admin } = require('../middleware/authMiddleware');
const auditService = require('../services/auditService');

router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id/role', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (req.body.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Only predefined admin identity can hold the admin role' });
    }

    user.role = req.body.role;
    await user.save();
    auditService.logAudit({ user: req.user._id, action: 'CHANGE_USER_ROLE', resource: 'User', resourceId: user._id, details: { newRole: user.role } });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    // Prevent deleting the predefined admin identity just in case
    const predefinedAdmin = process.env.ADMIN_USERNAME || 'admin';
    if (user.username === predefinedAdmin || user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete an administrator account' });
    }

    await User.findByIdAndDelete(req.params.id);
    auditService.logAudit({ user: req.user._id, action: 'DELETE_USER', resource: 'User', resourceId: user._id, details: { deletedUsername: user.username } });
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    const indexedDocuments = await Document.countDocuments({ status: 'completed' });
    const reportsGenerated = await Report.countDocuments();
    const totalValidations = await ValidationResult.countDocuments();
    const openValidations = await ValidationResult.countDocuments({ status: { $ne: 'resolved' } });
    
    res.json({ success: true, data: { totalUsers, totalDocuments, indexedDocuments, reportsGenerated, totalValidations, openValidations } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/system-health', protect, admin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({
      success: true,
      data: {
        backend: 'Online',
        mongoDB: mongoStatus,
        aiProvider: 'Online',
        vectorDB: 'Online'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
