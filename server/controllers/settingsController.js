const settingsService = require('../services/settingsService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/v1/settings
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getUserSettings(req.user._id);
    return sendSuccess(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const updated = await settingsService.updateUserSettings(req.user._id, req.body);
    return sendSuccess(res, updated, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/settings/language
exports.getLanguage = async (req, res, next) => {
  try {
    const language = await settingsService.getLanguageSettings(req.user._id);
    return sendSuccess(res, language, 'Language settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/settings/language
exports.updateLanguage = async (req, res, next) => {
  try {
    const lang = req.body.language || req.body.lang;
    const updated = await settingsService.updateLanguageSettings(req.user._id, lang);
    return sendSuccess(res, updated, 'Language preference updated successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/settings/appearance
exports.getAppearance = async (req, res, next) => {
  try {
    const appearance = await settingsService.getAppearanceSettings(req.user._id);
    return sendSuccess(res, appearance, 'Appearance settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/settings/appearance
exports.updateAppearance = async (req, res, next) => {
  try {
    const updated = await settingsService.updateAppearanceSettings(req.user._id, req.body.theme);
    return sendSuccess(res, updated, 'Appearance theme updated successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/settings/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await settingsService.getNotificationSettings(req.user._id);
    return sendSuccess(res, notifications, 'Notification settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/settings/notifications
exports.updateNotifications = async (req, res, next) => {
  try {
    const updated = await settingsService.updateNotificationSettings(req.user._id, req.body);
    return sendSuccess(res, updated, 'Notification preferences updated successfully');
  } catch (error) {
    next(error);
  }
};
