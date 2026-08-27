const Report = require('../models/Report');
const reportService = require('../services/reportService');

exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const { data, type } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, message: 'report type is required' });
    }
    const report = await reportService.generateReport(data || {}, type);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
