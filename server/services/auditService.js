const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, resource, resourceId, status = 'SUCCESS', details = {} }) => {
  try {
    const log = new AuditLog({
      user,
      action,
      resource,
      resourceId,
      status,
      details
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Audit Log Error (non-blocking):', error.message);
  }
};

const getAuditLogs = async (query = {}, options = { limit: 100, skip: 0 }) => {
  try {
    const logs = await AuditLog.find(query)
      .populate('user', 'username role')
      .sort({ timestamp: -1 })
      .skip(options.skip)
      .limit(options.limit);
      
    const total = await AuditLog.countDocuments(query);
    return { logs, total };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  logAudit,
  getAuditLogs
};
