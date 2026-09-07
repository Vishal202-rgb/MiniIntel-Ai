const User = require('../models/User');
const auditService = require('./auditService');

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English (US)', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
];

const SUPPORTED_THEMES = ['light', 'dark'];

// Format complete user settings
const formatSettings = (user) => {
  const prefs = user.preferences || {};
  const appearance = prefs.appearance || {};
  const notifications = prefs.notifications || {};

  return {
    language: {
      language: prefs.language || 'en',
      timezone: prefs.timezone || 'Asia/Kolkata (IST)',
      supportedLanguages: SUPPORTED_LANGUAGES
    },
    appearance: {
      theme: appearance.theme || 'light',
      supportedThemes: SUPPORTED_THEMES
    },
    notifications: {
      emailNotif: notifications.emailNotif !== undefined ? notifications.emailNotif : true,
      pushNotif: notifications.pushNotif !== undefined ? notifications.pushNotif : true,
      reportAlerts: notifications.reportAlerts !== undefined ? notifications.reportAlerts : false
    },
    account: {
      username: user.username,
      email: user.email || '',
      role: user.role,
      department: user.department || '',
      organization: 'CMPDI / Coal India Limited'
    },
    adminSettings: user.role === 'admin' ? {
      userManagementUrl: '/admin/users',
      systemHealthUrl: '/admin/system-health',
      auditLogsUrl: '/admin/audit-logs',
      privilegedAccess: true
    } : null
  };
};

// 1. Get all settings for user
const getUserSettings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  return formatSettings(user);
};

// 2. Bulk update user settings
const updateUserSettings = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.preferences = user.preferences || {};

  if (data.language) {
    const lang = typeof data.language === 'string' ? data.language : data.language.language || data.language.lang;
    if (lang && ['en', 'hi'].includes(lang.toLowerCase())) {
      user.preferences.language = lang.toLowerCase();
    }
  }

  if (data.appearance) {
    const theme = typeof data.appearance === 'string' ? data.appearance : data.appearance.theme;
    if (theme && ['light', 'dark'].includes(theme.toLowerCase())) {
      user.preferences.appearance = user.preferences.appearance || {};
      user.preferences.appearance.theme = theme.toLowerCase();
    }
  }

  if (data.notifications && typeof data.notifications === 'object') {
    user.preferences.notifications = user.preferences.notifications || {};
    if (data.notifications.emailNotif !== undefined) {
      user.preferences.notifications.emailNotif = Boolean(data.notifications.emailNotif);
    }
    if (data.notifications.pushNotif !== undefined) {
      user.preferences.notifications.pushNotif = Boolean(data.notifications.pushNotif);
    }
    if (data.notifications.reportAlerts !== undefined) {
      user.preferences.notifications.reportAlerts = Boolean(data.notifications.reportAlerts);
    }
  }

  await user.save();

  try {
    await auditService.logAudit({
      user: user._id,
      action: 'UPDATE_SETTINGS',
      resource: 'User',
      resourceId: user._id,
      details: { updatedKeys: Object.keys(data) }
    });
  } catch (err) {
    console.warn('Audit log write error:', err.message);
  }

  return formatSettings(user);
};

// 3. Language settings
const getLanguageSettings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const prefs = user.preferences || {};
  return {
    language: prefs.language || 'en',
    timezone: prefs.timezone || 'Asia/Kolkata (IST)',
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};

const updateLanguageSettings = async (userId, language) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.preferences = user.preferences || {};
  user.preferences.language = language.toLowerCase();
  await user.save();

  try {
    await auditService.logAudit({
      user: user._id,
      action: 'UPDATE_LANGUAGE_SETTINGS',
      resource: 'User',
      resourceId: user._id,
      details: { language: user.preferences.language }
    });
  } catch (err) {
    console.warn('Audit log write error:', err.message);
  }

  return {
    language: user.preferences.language,
    timezone: user.preferences.timezone || 'Asia/Kolkata (IST)',
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};

// 4. Appearance settings
const getAppearanceSettings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const prefs = user.preferences || {};
  const appearance = prefs.appearance || {};
  return {
    theme: appearance.theme || 'light',
    supportedThemes: SUPPORTED_THEMES
  };
};

const updateAppearanceSettings = async (userId, theme) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.preferences = user.preferences || {};
  user.preferences.appearance = user.preferences.appearance || {};
  user.preferences.appearance.theme = theme.toLowerCase();
  await user.save();

  try {
    await auditService.logAudit({
      user: user._id,
      action: 'UPDATE_APPEARANCE_SETTINGS',
      resource: 'User',
      resourceId: user._id,
      details: { theme: user.preferences.appearance.theme }
    });
  } catch (err) {
    console.warn('Audit log write error:', err.message);
  }

  return {
    theme: user.preferences.appearance.theme,
    supportedThemes: SUPPORTED_THEMES
  };
};

// 5. Notification settings
const getNotificationSettings = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const prefs = user.preferences || {};
  const notifications = prefs.notifications || {};
  return {
    emailNotif: notifications.emailNotif !== undefined ? notifications.emailNotif : true,
    pushNotif: notifications.pushNotif !== undefined ? notifications.pushNotif : true,
    reportAlerts: notifications.reportAlerts !== undefined ? notifications.reportAlerts : false
  };
};

const updateNotificationSettings = async (userId, notificationData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.preferences = user.preferences || {};
  user.preferences.notifications = user.preferences.notifications || {};

  if (notificationData.emailNotif !== undefined) {
    user.preferences.notifications.emailNotif = Boolean(notificationData.emailNotif);
  }
  if (notificationData.pushNotif !== undefined) {
    user.preferences.notifications.pushNotif = Boolean(notificationData.pushNotif);
  }
  if (notificationData.reportAlerts !== undefined) {
    user.preferences.notifications.reportAlerts = Boolean(notificationData.reportAlerts);
  }

  await user.save();

  try {
    await auditService.logAudit({
      user: user._id,
      action: 'UPDATE_NOTIFICATION_SETTINGS',
      resource: 'User',
      resourceId: user._id,
      details: user.preferences.notifications
    });
  } catch (err) {
    console.warn('Audit log write error:', err.message);
  }

  return {
    emailNotif: user.preferences.notifications.emailNotif,
    pushNotif: user.preferences.notifications.pushNotif,
    reportAlerts: user.preferences.notifications.reportAlerts
  };
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  getLanguageSettings,
  updateLanguageSettings,
  getAppearanceSettings,
  updateAppearanceSettings,
  getNotificationSettings,
  updateNotificationSettings
};
