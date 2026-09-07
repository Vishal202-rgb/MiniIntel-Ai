const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/v1/dashboard/overview
exports.getOverview = async (req, res, next) => {
  try {
    const data = await dashboardService.getOverview(req.user._id, req.user.role);
    return sendSuccess(res, data, 'Dashboard overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/dashboard/kpis
exports.getKpis = async (req, res, next) => {
  try {
    const data = await dashboardService.getKpis(req.user._id, req.user.role);
    return sendSuccess(res, data, 'Dashboard KPIs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/dashboard/activity
exports.getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 15, 100);
    const data = await dashboardService.getActivity(req.user._id, req.user.role, limit);
    return sendSuccess(res, data, 'Dashboard activity feed retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/dashboard/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const data = await dashboardService.getAlerts(req.user._id, req.user.role);
    return sendSuccess(res, data, 'Dashboard alerts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/dashboard/recent-documents
exports.getRecentDocuments = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const data = await dashboardService.getRecentDocuments(req.user._id, req.user.role, limit);
    return sendSuccess(res, data, 'Recent documents retrieved successfully');
  } catch (error) {
    next(error);
  }
};
