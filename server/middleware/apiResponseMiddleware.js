const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Middleware that binds standard response helpers directly to Express response object
 */
const apiResponseMiddleware = (req, res, next) => {
  res.apiSuccess = (data = {}, message = 'Success', statusCode = 200, meta = undefined) => {
    return sendSuccess(res, data, message, statusCode, meta);
  };

  res.apiError = (message = 'An error occurred', error = null, statusCode = 500) => {
    return sendError(res, message, error, statusCode);
  };

  next();
};

module.exports = apiResponseMiddleware;
