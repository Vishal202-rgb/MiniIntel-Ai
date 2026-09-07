const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err.stack || err.message);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Multer Errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = `File Upload Error: ${err.message}`;
    errorCode = 'MULTER_ERROR';
  } else if (err.message && err.message.includes('Invalid file type')) {
    statusCode = 400;
    errorCode = 'INVALID_FILE_TYPE';
  }

  // Mongoose Validation & Cast Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    errorCode = 'MONGOOSE_VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with ID of ${err.value}`;
    errorCode = 'RESOURCE_NOT_FOUND';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authorization token';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authorization token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Dual compatibility: includes both standard format ({ success, message, error }) and legacy { error }
  res.status(statusCode).json({
    success: false,
    message,
    error: message,
    code: errorCode
  });
};

module.exports = errorHandler;
