/**
 * Request validators for authentication endpoints
 */

const validateLogin = (req) => {
  const errors = [];
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || !username.trim()) {
    errors.push('Field "username" is required and must be a non-empty string');
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.push('Field "password" is required');
  }

  return errors;
};

const validateRegister = (req) => {
  const errors = [];
  const { username, password, email } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    errors.push('Field "username" is required and must be at least 3 characters');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Field "password" is required and must be at least 6 characters');
  }

  if (email && typeof email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Field "email" must be a valid email address');
    }
  }

  return errors;
};

const validateProfileUpdate = (req) => {
  const errors = [];
  const { email, department } = req.body;

  if (email !== undefined) {
    if (typeof email !== 'string' || !email.trim()) {
      errors.push('Field "email" must be a valid non-empty string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Field "email" must be a valid email address');
      }
    }
  }

  if (department !== undefined && typeof department !== 'string') {
    errors.push('Field "department" must be a string');
  }

  return errors;
};

const validateChangePassword = (req) => {
  const errors = [];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Field "currentPassword" is required');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('Field "newPassword" is required and must be at least 6 characters');
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('Field "newPassword" must be different from "currentPassword"');
  }

  return errors;
};

module.exports = {
  validateLogin,
  validateRegister,
  validateProfileUpdate,
  validateChangePassword
};
