const { sendError } = require('../utils/apiResponse');

/**
 * Creates a middleware to validate request properties against defined rule functions.
 * @param {Function} validatorFn - Function receiving req and returning array of error messages
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    const errors = validatorFn(req);
    if (errors && errors.length > 0) {
      return sendError(
        res,
        'Validation failed: ' + errors.join('; '),
        errors[0],
        400
      );
    }
    next();
  };
};

module.exports = validate;
