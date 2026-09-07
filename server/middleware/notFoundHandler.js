const { sendError } = require('../utils/apiResponse');

/**
 * 404 Not Found Handler for undefined API routes
 */
const notFoundHandler = (req, res, next) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    'ROUTE_NOT_FOUND',
    404
  );
};

module.exports = notFoundHandler;
