const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');
const Report = require('../models/Report');
const auditService = require('../services/auditService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// 1. Get audit logs with pagination & filtering
exports.getAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const page = parseInt(req.query.page) || 1;
    const skip = req.query.skip !== undefined ? parseInt(req.query.skip) : (page - 1) * limit;

    // RBAC: Normal users see only their own logs, admins see all
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };

    if (req.query.action) query.action = req.query.action;
    if (req.query.status) query.status = req.query.status;
    if (req.query.resource) query.resource = req.query.resource;

    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) query.timestamp.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.timestamp.$lte = new Date(req.query.endDate);
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { action: searchRegex },
        { resource: searchRegex },
        { ipAddress: searchRegex }
      ];
    }

    const result = await auditService.getAuditLogs(query, { limit, skip });
    const meta = {
      total: result.total,
      limit,
      skip,
      page,
      pages: Math.ceil(result.total / limit)
    };

    return sendSuccess(res, result.logs, 'Audit logs retrieved successfully', 200, meta);
  } catch (error) {
    next(error);
  }
};

// 2. Get single audit log by ID
exports.getAuditById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('user', 'username role');
    if (!log) {
      return sendError(res, 'Audit log entry not found', 'NOT_FOUND', 404);
    }

    // RBAC: Normal user can only view their own audit log
    const isOwner = log.user?._id?.toString() === req.user._id.toString() ||
                    log.user?.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isOwner) {
      return sendError(res, 'Access forbidden: unauthorized audit log access', 'FORBIDDEN', 403);
    }

    return sendSuccess(res, log, 'Audit log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// 3. Get audit logs for a specific user
exports.getAuditByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // RBAC: Admin can view any user's logs; normal users can only view their own
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return sendError(res, "Access forbidden: cannot view another user's audit logs", 'FORBIDDEN', 403);
    }

    const logs = await AuditLog.find({ user: userId })
      .populate('user', 'username role')
      .sort({ timestamp: -1 })
      .limit(100);

    return sendSuccess(res, logs, 'User audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// 4. Get audit logs for a specific document
exports.getAuditByDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // Verify document exists and authorization
    const doc = await Document.findById(documentId);
    if (!doc) {
      return sendError(res, 'Document not found', 'NOT_FOUND', 404);
    }

    const isOwner = doc.userId?._id?.toString() === req.user._id.toString() ||
                    doc.userId?.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isOwner) {
      return sendError(res, 'Access forbidden: unauthorized to view audit logs for this document', 'FORBIDDEN', 403);
    }

    const logs = await AuditLog.find({
      $or: [
        { resource: 'Document', resourceId: documentId },
        { 'details.documentId': documentId },
        { resourceId: documentId }
      ]
    }).populate('user', 'username role').sort({ timestamp: -1 });

    return sendSuccess(res, logs, 'Document audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// 5. Get audit logs for a specific report
exports.getAuditByReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return sendError(res, 'Report not found', 'NOT_FOUND', 404);
    }

    const isOwner = report.generatedBy?._id?.toString() === req.user._id.toString() ||
                    report.generatedBy?.toString() === req.user._id.toString();

    if (req.user.role !== 'admin' && !isOwner) {
      return sendError(res, 'Access forbidden: unauthorized to view audit logs for this report', 'FORBIDDEN', 403);
    }

    const logs = await AuditLog.find({
      $or: [
        { resource: 'Report', resourceId: reportId },
        { 'details.reportId': reportId },
        { resourceId: reportId }
      ]
    }).populate('user', 'username role').sort({ timestamp: -1 });

    return sendSuccess(res, logs, 'Report audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// 6. Export audit logs (CSV or JSON)
exports.exportAuditLogs = async (req, res, next) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();

    // RBAC: Admin exports all or filtered; regular user exports only their own
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };

    if (req.query.action) query.action = req.query.action;
    if (req.query.resource) query.resource = req.query.resource;
    if (req.query.status) query.status = req.query.status;

    const logs = await AuditLog.find(query)
      .populate('user', 'username role')
      .sort({ timestamp: -1 })
      .limit(5000);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs_export.json"');
      return res.send(JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalLogs: logs.length,
        logs
      }, null, 2));
    }

    // Default: CSV export
    const header = 'ID,Timestamp,User,Role,Action,Resource,ResourceId,Status,IPAddress\n';
    const rows = logs.map(l => {
      const username = (l.user?.username || 'SYSTEM').replace(/"/g, '""');
      const role = (l.user?.role || 'system').replace(/"/g, '""');
      const action = (l.action || '').replace(/"/g, '""');
      const resource = (l.resource || '').replace(/"/g, '""');
      const resourceId = l.resourceId ? l.resourceId.toString() : '';
      const status = l.status || 'SUCCESS';
      const ip = (l.ipAddress || '').replace(/"/g, '""');
      const date = l.timestamp ? new Date(l.timestamp).toISOString() : '';

      return `"${l._id}","${date}","${username}","${role}","${action}","${resource}","${resourceId}","${status}","${ip}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_logs_export.csv"');
    return res.send(header + rows);
  } catch (error) {
    next(error);
  }
};

// 7. Get audit statistics
exports.getAuditStats = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    const result = await auditService.getAuditLogs(query, { limit: 10000 });
    const logs = result.logs;
    
    const stats = {
      totalEvents: logs.length,
      successful: logs.filter(l => l.status === 'SUCCESS').length,
      failed: logs.filter(l => l.status === 'FAILED').length,
      activeUsers: new Set(logs.map(l => l.user ? l.user._id?.toString() || l.user.toString() : null).filter(Boolean)).size
    };
    
    return sendSuccess(res, stats, 'Audit statistics retrieved');
  } catch (error) {
    next(error);
  }
};
