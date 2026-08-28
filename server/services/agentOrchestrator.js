const extractionService = require('./extractionService');
const validationService = require('./validationService');
const analyticsService = require('./analyticsService');
const ragService = require('./ragService');
const reportService = require('./reportService');
const aiAssistantService = require('./aiAssistantService');
const llmService = require('./llmService');
const AuditLog = require('../models/AuditLog');

const orchestrateTask = async (task, context) => {
  try {
    let result;
    const reqContext = { llmCallCount: 0 };
    
    // FAST PATH: Rule-based classification to save Gemini quota
    let action = 'rag';
    let parameters = null;
    
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('analyze') || lowerTask.includes('production') || lowerTask.includes('trends')) {
      action = 'analyze';
      reqContext.maxCalls = 5; // Complex task
    } else if ((lowerTask.includes('extract') || lowerTask.includes('parse')) && (context.documentId)) {
      action = 'extract';
      reqContext.maxCalls = 4; // Normal query
    } else if ((lowerTask.includes('validate') || lowerTask.includes('conflict')) && (context.recordId || context.documentId)) {
      action = 'validate';
      reqContext.maxCalls = 4; // Normal query
    } else if ((lowerTask.includes('report') || lowerTask.includes('generate')) && context.data) {
      // Only jump to report generator if we actually have data/document context explicitly sent for report generation
      action = 'report';
      reqContext.maxCalls = 5; // Complex task
    } else if (lowerTask.match(/^(say )?hello|hi\b|how are you|which ai|who are you/)) {
      action = 'rag'; // General chat
      reqContext.maxCalls = 1; // Simple query
    } else {
      // Fallback: Use LLM if we genuinely can't guess (costs 1 request)
      const systemPrompt = `You are a multi-agent orchestrator for MineIntel AI. 
Analyze the following user task and classify it into exactly one of these actions:
- "extract": extracting data from a specific document.
- "validate": validating data records.
- "analyze": analyzing production trends, anomalies, or target achievements.
- "rag": answering general questions using the knowledge base.
- "report": generating structured reports.

Return ONLY a JSON object with:
- "action": the classified action string (must be one of the above).
- "parameters": any extracted entities as key-value pairs (e.g. year, mine name).`;

      const classification = await llmService.callLLM(systemPrompt, task, { format: 'json', reqContext });
      
      // We already used 1 call for classification
      // If classification failed to return action, default to rag
      action = classification.action || 'rag';
      parameters = classification.parameters;
      
      if (action === 'analyze' || action === 'report') reqContext.maxCalls = 5;
      else if (action === 'rag') reqContext.maxCalls = 4;
      else reqContext.maxCalls = 4;
    }

    // Step 2: Route to the appropriate agent/service
    switch (action) {
      case 'extract':
        const extDocId = context.documentId || parameters?.documentId;
        if (!extDocId) {
          const fallbackExt = await aiAssistantService.processQuestion(task, context.conversationId, reqContext);
          result = { message: fallbackExt.answer, conversationId: fallbackExt.conversationId };
        } else {
          result = await extractionService.extractFromDocument(extDocId); // fixed from processDocument
        }
        break;
      case 'validate':
        const valDocId = context.documentId || parameters?.documentId || context.recordId;
        if (!valDocId) {
          const fallbackVal = await aiAssistantService.processQuestion(task, context.conversationId, reqContext);
          result = { message: fallbackVal.answer, conversationId: fallbackVal.conversationId };
        } else {
          result = await validationService.validateDocument(valDocId); // fixed from validateRecord
        }
        break;
      case 'analyze':
        // The user wants an analysis of production data. We can use the RAG / AI Assistant to provide a contextual answer based on the DB.
        const analyzeRes = await aiAssistantService.processQuestion(task, context.conversationId, reqContext);
        result = { 
          message: analyzeRes.answer,
          sources: analyzeRes.sources,
          data: parameters,
          conversationId: analyzeRes.conversationId
        };
        break;
      case 'rag':
        const ragRes = await aiAssistantService.processQuestion(task, context.conversationId, reqContext);
        result = { 
          message: ragRes.answer,
          sources: ragRes.sources,
          conversationId: ragRes.conversationId
        };
        break;
      case 'report':
        const reportData = parameters || context.data || {};
        if (!reportData.documentId && !context.data) {
          // If no document context was supplied, it's just a general question about a report.
          const fallbackRep = await aiAssistantService.processQuestion(task, context.conversationId, reqContext);
          result = { message: fallbackRep.answer, conversationId: fallbackRep.conversationId };
        } else {
          result = await reportService.generateReport(reportData, context.type || 'custom');
        }
        break;
      default:
        // Fallback if LLM returns something unexpected
        const fallbackRes = await aiAssistantService.processQuestion(task, context.conversationId, reqContext);
        result = { 
          message: fallbackRes.answer,
          conversationId: fallbackRes.conversationId 
        };
    }

    const auditLogData = {
      action: `Orchestrated Task: ${action} - ${task.substring(0, 50)}`,
      resource: 'Task',
      status: 'SUCCESS'
    };
    if (context.user && context.user.match(/^[0-9a-fA-F]{24}$/)) {
      auditLogData.user = context.user;
    }
    const auditLog = new AuditLog(auditLogData);
    await auditLog.save();

    return result;
  } catch (error) {
    const auditLogData = {
      action: `Failed Task: ${task.substring(0, 50)}`,
      resource: 'Task',
      status: 'FAILED',
      details: error.message
    };
    if (context.user && context.user.match(/^[0-9a-fA-F]{24}$/)) {
      auditLogData.user = context.user;
    }
    const auditLog = new AuditLog(auditLogData);
    await auditLog.save().catch(e => console.error('Failed to save audit log:', e));
    
    throw new Error(`Orchestration error for task: ` + error.message);
  }
};

module.exports = {
  orchestrateTask
};
