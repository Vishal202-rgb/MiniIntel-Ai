const extractionService = require('./extractionService');
const validationService = require('./validationService');
const analyticsService = require('./analyticsService');
const ragService = require('./ragService');
const reportService = require('./reportService');
const AuditLog = require('../models/AuditLog');

const orchestrateTask = async (task, context) => {
  try {
    let result;
    
    switch (task) {
      case 'extract':
        result = await extractionService.processDocument(context.documentId);
        break;
      case 'validate':
        result = await validationService.validateRecord(context.recordId);
        break;
      case 'analyze':
        const trends = await analyticsService.getProductionTrends();
        const anomalies = await analyticsService.getAnomalies();
        result = { trends, anomalies };
        break;
      case 'rag':
        result = await ragService.queryKnowledgeBase(context.query);
        break;
      case 'report':
        result = await reportService.generateReport(context.data, context.type);
        break;
      default:
        throw new Error(`Unknown task type: ${task}`);
    }

    // Log the orchestration action
    const auditLog = new AuditLog({
      action: `Orchestrated Task: ${task}`,
      entity: 'Task',
      user: context.user || 'system'
    });
    await auditLog.save();

    return result;
  } catch (error) {
    const auditLog = new AuditLog({
      action: `Failed Task: ${task}`,
      entity: 'Task',
      user: context.user || 'system'
    });
    await auditLog.save();
    
    throw new Error(`Orchestration error for task ${task}: ` + error.message);
  }
};

module.exports = {
  orchestrateTask
};
