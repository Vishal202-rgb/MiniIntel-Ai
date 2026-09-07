const express = require('express');
const router = express.Router();
const settingsController = require('../../../controllers/settingsController');
const { authenticate } = require('../../../middleware/auth');
const validate = require('../../../validators/validate');
const {
  validateLanguage,
  validateAppearance,
  validateNotifications,
  validateBulkSettings
} = require('../../../validators/settingsValidator');

// 1. Complete user settings
router.get('/', authenticate, settingsController.getSettings);
router.put('/', authenticate, validate(validateBulkSettings), settingsController.updateSettings);

// 2. Language & Region
router.get('/language', authenticate, settingsController.getLanguage);
router.put('/language', authenticate, validate(validateLanguage), settingsController.updateLanguage);

// 3. Appearance & Theme
router.get('/appearance', authenticate, settingsController.getAppearance);
router.put('/appearance', authenticate, validate(validateAppearance), settingsController.updateAppearance);

// 4. Notifications
router.get('/notifications', authenticate, settingsController.getNotifications);
router.put('/notifications', authenticate, validate(validateNotifications), settingsController.updateNotifications);

module.exports = router;
