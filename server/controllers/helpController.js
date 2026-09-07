const helpService = require('../services/helpService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/v1/help
exports.getHelpOverview = async (req, res, next) => {
  try {
    const data = await helpService.getHelpOverview();
    return sendSuccess(res, data, 'Help & Support overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/help/faqs
exports.getFaqs = async (req, res, next) => {
  try {
    const data = await helpService.getFaqs(req.query.category);
    return sendSuccess(res, data, 'FAQs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/help/faqs/:id
exports.getFaqById = async (req, res, next) => {
  try {
    const faq = await helpService.getFaqById(req.params.id);
    return sendSuccess(res, faq, 'FAQ retrieved successfully');
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 'NOT_FOUND', 404);
    }
    next(error);
  }
};

// GET /api/v1/help/search
exports.searchHelp = async (req, res, next) => {
  try {
    const query = req.query.q || req.query.query || '';
    const results = await helpService.searchHelp(query);
    return sendSuccess(res, results, 'Help search executed successfully');
  } catch (error) {
    next(error);
  }
};
