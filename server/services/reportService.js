const Report = require('../models/Report');
const Document = require('../models/Document');
const ragService = require('./ragService');
const llmService = require('./llmService');
const auditService = require('./auditService');
const miningIntelligenceService = require('./miningIntelligenceService');

const generateReport = async (data, type, userId, reqContext = {}) => {
  try {
    const { documentId, instructions } = data;
    let contextText = '';
    
    // Retrieve context from specific document if provided, otherwise generic search
    let searchQuery = type;
    if (instructions) searchQuery += ' ' + instructions;
    
    // Get relevant chunks using RAG
    const similarChunks = await ragService.searchSimilar(searchQuery, 10, reqContext);
    
    if (documentId) {
      // Filter chunks to only include this document if requested
      const filteredChunks = similarChunks.filter(c => c.documentId.toString() === documentId);
      const chunksToUse = filteredChunks.length > 0 ? filteredChunks : similarChunks;
      chunksToUse.forEach((chunk, i) => {
        const pageLabel = chunk.pageNumber ? `Page ${chunk.pageNumber}` : 'Page N/A';
        contextText += `--- Source Reference ${i+1} [${pageLabel}] ---\n${chunk.content}\n\n`;
      });
    } else {
      similarChunks.forEach((chunk, i) => {
        const pageLabel = chunk.pageNumber ? `Page ${chunk.pageNumber}` : 'Page N/A';
        contextText += `--- Source Reference ${i+1} [${pageLabel}] ---\n${chunk.content}\n\n`;
      });
    }

    // INJECT MINING INTELLIGENCE (HISTORICAL COMPARISON & ANOMALY DETECTION)
    try {
      const { summaryText, evidenceText } = await miningIntelligenceService.analyzeDataAndFindAnomalies(reqContext);
      contextText += '\n\n=== MINING INTELLIGENCE (ANOMALIES & EVIDENCE) ===\n';
      contextText += summaryText + '\n' + evidenceText + '\n';
    } catch (err) {
      console.error('Failed to inject mining intelligence into report context:', err);
    }

    const systemPrompt = `You are an expert mining operations analyst for MineIntel. Generate a highly professional '${type}' report based ONLY on the provided context.
    
    Do NOT hallucinate numbers. Preserve units and financial-year labels. Show calculations clearly. Reference the source document/page when available.
    
    CRITICAL CITATION RULES:
    - NEVER guess or infer a page number.
    - If a source says [Page N/A] or does not have a page number, you MUST NOT write "Page 1". Simply cite the document name or reference number.
    - Only cite the page number if it is explicitly provided in the bracketed source reference (e.g., [Page 2]).
    
    Output the report in Markdown format with the following sections (if applicable to the type):
    1. Executive Summary
    2. Production Performance
    3. Dispatch Performance
    4. Target Achievement
    5. Production-Dispatch Gap
    6. Key Operational Risks
    7. Evidence / Source References
    8. AI Insights (Include a Management-Ready Insight here for any anomalies: Finding, Impact, Evidence, Explanation)
    9. Recommendations
    
    Additional Instructions from User: ${instructions || 'None'}
    
    Context:
    ${contextText}`;

    const reportContent = await llmService.callLLM(systemPrompt, 'Generate the report.', { reqContext });

    const reportTitle = `${type} Report - ${new Date().toLocaleDateString()}`;
    
    const report = new Report({
      title: reportTitle,
      type: type,
      content: { markdown: reportContent, sources: similarChunks.map(c => c.documentId) },
      status: 'completed',
      generatedBy: userId
    });

    await report.save();
    
    // Non-blocking audit log
    auditService.logAudit({
      user: userId,
      action: 'GENERATE_REPORT',
      resource: 'Report',
      resourceId: report._id,
      details: { type, documentId }
    });

    return report;
  } catch (error) {
    throw new Error('Error generating report: ' + error.message);
  }
};

module.exports = {
  generateReport
};
