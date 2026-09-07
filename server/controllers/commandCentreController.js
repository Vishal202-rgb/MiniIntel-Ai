const commandCentreService = require('../services/commandCentreService');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/v1/command-centre/overview
exports.getOverview = async (req, res, next) => {
  try {
    const data = await commandCentreService.getOverview();
    return sendSuccess(res, data, 'Command Centre overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/command-centre/pipeline
exports.getPipeline = async (req, res, next) => {
  try {
    const data = await commandCentreService.getPipeline();
    return sendSuccess(res, data, 'Command Centre pipeline retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/command-centre/status
exports.getStatus = async (req, res, next) => {
  try {
    const data = await commandCentreService.getStatus();
    return sendSuccess(res, data, 'Command Centre status retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/command-centre/attention-items
exports.getAttentionItems = async (req, res, next) => {
  try {
    const data = await commandCentreService.getAttentionItems();
    return sendSuccess(res, data, 'Command Centre attention items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/command-centre/activity
exports.getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await commandCentreService.getActivity(limit);
    return sendSuccess(res, data, 'Command Centre activity feed retrieved successfully');
  } catch (error) {
    next(error);
  }
};
