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
    
    let searchQuery = type;
    if (instructions) searchQuery += ' ' + instructions;
    
    const similarChunks = await ragService.searchSimilar(searchQuery, 10, reqContext);
    
    if (documentId) {
      const filteredChunks = similarChunks.filter(c => c.documentId.toString() === documentId);
      const chunksToUse = filteredChunks.length > 0 ? filteredChunks : similarChunks;
      chunksToUse.forEach((chunk, i) => {
        const pageLabel = chunk.pageNumber ? `Page ${chunk.pageNumber}` : 'Page N/A';
        const docName = chunk.documentId?.originalName || chunk.documentId?.filename || 'Document';
        contextText += `--- Source Reference ${i+1} — ${docName} [${pageLabel}] ---\n${chunk.content}\n\n`;
      });
    } else {
      similarChunks.forEach((chunk, i) => {
        const pageLabel = chunk.pageNumber ? `Page ${chunk.pageNumber}` : 'Page N/A';
        const docName = chunk.documentId?.originalName || chunk.documentId?.filename || 'Document';
        contextText += `--- Source Reference ${i+1} — ${docName} [${pageLabel}] ---\n${chunk.content}\n\n`;
      });
    }

    // INJECT MINING INTELLIGENCE
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
    8. AI Insights
    9. Recommendations
    
    At the end, add a section called "## Evidence Appendix" that lists every source reference used, with the document name, page number, and a brief excerpt of the cited text.
    
    Additional Instructions from User: ${instructions || 'None'}
    
    Context:
    ${contextText}`;

    const reportContent = await llmService.callLLM(systemPrompt, 'Generate the report.', { reqContext });

    // Compute evidence coverage
    const citedSources = similarChunks.filter(c => c.similarityScore > 0.3);
    const evidenceCoverage = {
      total: similarChunks.length,
      cited: citedSources.length,
      percentage: similarChunks.length > 0 ? Math.round((citedSources.length / similarChunks.length) * 100) : 0
    };

    // Compute confidence score from avg similarity
    const avgSimilarity = similarChunks.length > 0
      ? similarChunks.reduce((sum, c) => sum + (c.similarityScore || 0), 0) / similarChunks.length
      : 0;
    const confidenceScore = Math.round(avgSimilarity * 100) / 100;

    const reportTitle = `${type} Report - ${new Date().toLocaleDateString()}`;
    
    const report = new Report({
      title: reportTitle,
      type: type,
      content: {
        markdown: reportContent,
        sources: similarChunks.map(c => ({
          documentId: c.documentId?._id || c.documentId,
          documentName: c.documentId?.originalName || c.documentId?.filename || 'Document',
          pageNumber: c.pageNumber,
          similarity: c.similarityScore,
          excerpt: (c.content || '').substring(0, 150)
        }))
      },
      status: 'draft',
      generatedBy: userId,
      confidenceScore,
      evidenceCoverage
    });

    await report.save();
    
    auditService.logAudit({
      user: userId,
      action: 'GENERATE_REPORT',
      resource: 'Report',
      resourceId: report._id,
      details: { type, documentId, confidenceScore, evidenceCoverage }
    });

    return report;
  } catch (error) {
    throw new Error('Error generating report: ' + error.message);
  }
};

// Export report content in different formats
const exportReport = async (reportId, format = 'json') => {
  const report = await Report.findById(reportId).populate('generatedBy', 'username').lean();
  if (!report) throw new Error('Report not found');

  const markdown = report.content?.markdown || '';
  const sources = report.content?.sources || [];

  switch (format) {
    case 'json':
      return {
        contentType: 'application/json',
        filename: `${report.title.replace(/\s+/g, '_')}.json`,
        data: JSON.stringify({
          title: report.title,
          type: report.type,
          status: report.status,
          generatedBy: report.generatedBy?.username,
          generatedAt: report.createdAt,
          confidenceScore: report.confidenceScore,
          evidenceCoverage: report.evidenceCoverage,
          content: markdown,
          sources
        }, null, 2)
      };

    case 'csv': {
      // Export sources as CSV
      const header = 'Document,Page,Similarity,Excerpt\n';
      const rows = sources.map(s =>
        `"${s.documentName || ''}","${s.pageNumber || 'N/A'}","${s.similarity || ''}","${(s.excerpt || '').replace(/"/g, '""')}"`
      ).join('\n');
      return {
        contentType: 'text/csv',
        filename: `${report.title.replace(/\s+/g, '_')}_sources.csv`,
        data: header + rows
      };
    }

    case 'md':
    case 'docx': {
      // Return plain markdown (client can render or convert)
      const fullMd = `# ${report.title}\n\n**Type:** ${report.type}  \n**Status:** ${report.status}  \n**Generated:** ${report.createdAt}  \n**Confidence:** ${Math.round((report.confidenceScore || 0) * 100)}%  \n**Evidence Coverage:** ${report.evidenceCoverage?.percentage || 0}%\n\n---\n\n${markdown}`;
      return {
        contentType: 'text/markdown',
        filename: `${report.title.replace(/\s+/g, '_')}.md`,
        data: fullMd
      };
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

module.exports = {
  generateReport,
  exportReport
};
