import auditApi from '../api/auditApi';

export const getLogs = async (params) => {
  try {
    const res = await auditApi.getAuditLogs(params);
    const data = res.data?.data || res.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

export const getStats = async () => {
  try {
    const res = await auditApi.getAuditStats();
    return res.data || res;
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return null;
  }
};

export default {
  getLogs,
  getStats,
  exportAudit: auditApi.exportAudit,
};
