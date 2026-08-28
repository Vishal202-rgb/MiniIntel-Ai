const auditService = require('../services/auditService');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    
    // Normal users see only their own logs, admins see all.
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    if (req.query.action) query.action = req.query.action;
    if (req.query.status) query.status = req.query.status;

    const result = await auditService.getAuditLogs(query, { limit, skip });
    res.status(200).json({ success: true, data: result.logs, total: result.total });
  } catch (error) {
    next(error);
  }
};

exports.getAuditStats = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    const result = await auditService.getAuditLogs(query, { limit: 10000 });
    const logs = result.logs;
    
    const stats = {
      totalEvents: logs.length,
      successful: logs.filter(l => l.status === 'SUCCESS').length,
      failed: logs.filter(l => l.status === 'FAILED').length,
      activeUsers: new Set(logs.map(l => l.user ? l.user._id.toString() : null).filter(Boolean)).size
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
