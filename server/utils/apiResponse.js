/**
 * Standard API Response Utilities for MineIntel AI
 * Enforces uniform success and error payloads across REST endpoints.
 */

/**
 * Send standard success response
 * @param {import('express').Response} res - Express response object
 * @param {any} data - Payload data
 * @param {string} [message='Success'] - Descriptive success message
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [meta] - Optional pagination or metadata
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200, meta = undefined) => {
  const payload = {
    success: true,
    data: data !== null && data !== undefined ? data : {},
    message
  };

  if (meta !== undefined) {
    payload.meta = meta;
    payload.pagination = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Send standard error response
 * @param {import('express').Response} res - Express response object
 * @param {string} [message='An error occurred'] - Human-readable error description
 * @param {string|object|null} [error=null] - Technical error detail or error code
 * @param {number} [statusCode=500] - HTTP status code
 */
const sendError = (res, message = 'An error occurred', error = null, statusCode = 500) => {
  const payload = {
    success: false,
    message,
    error: error || message
  };

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};
