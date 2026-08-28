const Report = require('../models/Report');
const reportService = require('../services/reportService');

exports.getReports = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { generatedBy: req.user._id };
    const reports = await Report.find(query).sort({ createdAt: -1 });
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
    const reqContext = { userId: req.user._id, isComplex: true };
    const report = await reportService.generateReport(data || {}, type, req.user._id, reqContext);
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
    // Check ownership if not admin
    if (req.user.role !== 'admin' && report.generatedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this report' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
