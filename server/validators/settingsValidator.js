/**
 * Request validators for Settings endpoints
 */

const validateLanguage = (req) => {
  const errors = [];
  const lang = req.body.language || req.body.lang;

  if (!lang) {
    errors.push('Field "language" is required');
  } else if (!['en', 'hi'].includes(lang.toLowerCase())) {
    errors.push('Supported languages are: "en" (English), "hi" (Hindi)');
  }

  return errors;
};

const validateAppearance = (req) => {
  const errors = [];
  const theme = req.body.theme;

  if (!theme) {
    errors.push('Field "theme" is required');
  } else if (!['light', 'dark'].includes(theme.toLowerCase())) {
    errors.push('Supported themes are: "light", "dark"');
  }

  return errors;
};

const validateNotifications = (req) => {
  const errors = [];
  const emailNotif = req.body.emailNotif !== undefined ? req.body.emailNotif : req.body.emailNotifications;
  const pushNotif = req.body.pushNotif !== undefined ? req.body.pushNotif : req.body.pushNotifications;
  const reportAlerts = req.body.reportAlerts;

  if (emailNotif === undefined && pushNotif === undefined && reportAlerts === undefined) {
    errors.push('At least one notification setting ("emailNotif", "pushNotif", "reportAlerts") must be provided');
  }

  if (emailNotif !== undefined && typeof emailNotif !== 'boolean') {
    errors.push('"emailNotif" must be a boolean');
  }
  if (pushNotif !== undefined && typeof pushNotif !== 'boolean') {
    errors.push('"pushNotif" must be a boolean');
  }
  if (reportAlerts !== undefined && typeof reportAlerts !== 'boolean') {
    errors.push('"reportAlerts" must be a boolean');
  }

  // Normalize back to body for controller
  if (req.body.emailNotif === undefined && emailNotif !== undefined) req.body.emailNotif = emailNotif;
  if (req.body.pushNotif === undefined && pushNotif !== undefined) req.body.pushNotif = pushNotif;

  return errors;
};

const validateBulkSettings = (req) => {
  const errors = [];
  const { language, appearance, notifications } = req.body;

  if (!language && !appearance && !notifications) {
    errors.push('At least one settings category ("language", "appearance", "notifications") must be provided');
  }

  if (language) {
    const lang = typeof language === 'string' ? language : language.language || language.lang;
    if (lang && !['en', 'hi'].includes(lang.toLowerCase())) {
      errors.push('Invalid language code in language settings');
    }
  }

  if (appearance) {
    const theme = typeof appearance === 'string' ? appearance : appearance.theme;
    if (theme && !['light', 'dark'].includes(theme.toLowerCase())) {
      errors.push('Invalid theme in appearance settings');
    }
  }

  return errors;
};

module.exports = {
  validateLanguage,
  validateAppearance,
  validateNotifications,
  validateBulkSettings
};
