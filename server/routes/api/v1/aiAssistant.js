const express = require('express');
const router = express.Router();
const aiAssistantController = require('../../../controllers/aiAssistantController');
const { authenticate } = require('../../../middleware/auth');
const { validateQuery, validateHistoryId } = require('../../../validators/aiAssistantValidator');

const handleValidation = (validator) => (req, res, next) => {
  const errors = validator(req);
  if (errors && errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  next();
};

// REST v1 Endpoints
router.post('/query', authenticate, handleValidation(validateQuery), aiAssistantController.queryOrAsk);
router.post('/ask', authenticate, handleValidation(validateQuery), aiAssistantController.queryOrAsk);

router.get('/history', authenticate, aiAssistantController.getHistory);
router.get('/history/:id', authenticate, handleValidation(validateHistoryId), aiAssistantController.getHistoryById);
router.delete('/history/:id', authenticate, handleValidation(validateHistoryId), aiAssistantController.deleteHistoryById);

// Legacy aliases preserved for backward compatibility
router.get('/conversations', authenticate, aiAssistantController.getHistory);
router.get('/conversations/:id', authenticate, handleValidation(validateHistoryId), aiAssistantController.getHistoryById);

module.exports = router;
