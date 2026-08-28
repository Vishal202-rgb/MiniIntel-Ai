const analyticsService = require('../services/analyticsService');

exports.getTrends = async (req, res, next) => {
  try {
    const trends = await analyticsService.getProductionTrends();
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

exports.getAnomalies = async (req, res, next) => {
  try {
    const anomalies = await analyticsService.getAnomalies();
    res.status(200).json({ success: true, data: anomalies });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboardData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
