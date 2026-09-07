const analyticsService = require('../services/analyticsService');

exports.getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Analytics overview retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getKPIs = async (req, res, next) => {
  try {
    const data = await analyticsService.getKPIs(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'KPI metrics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduction = async (req, res, next) => {
  try {
    const data = await analyticsService.getProductionMetrics(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Production analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getDispatch = async (req, res, next) => {
  try {
    const data = await analyticsService.getDispatchMetrics(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Dispatch analytics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getProductionTrends(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Production trends retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getVariance = async (req, res, next) => {
  try {
    const data = await analyticsService.getVarianceAnalysis(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Variance analysis retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnomalies = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnomalies(req.user, req.query);
    res.status(200).json({
      success: true,
      data,
      message: 'Anomalies retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Legacy handler for React UI (/api/analytics/dashboard)
exports.getDashboardData = async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboardData(req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
