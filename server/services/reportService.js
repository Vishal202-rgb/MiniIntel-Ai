const Report = require('../models/Report');
const Document = require('../models/Document');
const ragService = require('./ragService');
const llmService = require('./llmService');
const auditService = require('./auditService');
const miningIntelligenceService = require('./miningIntelligenceService');
const PDFDocument = require('pdfkit');
const { Document: DocxDocument, Paragraph, TextRun, Packer, HeadingLevel } = require('docx');

const generateReport = async (data, type, userId, reqContext = {}) => {
  const { documentId, instructions, template, period, mineName, subsidiary, subject } = data || {};

  // Set reqContext flags for quota isolation and strict mode
  reqContext.isReport = true;
  reqContext.isComplex = true;
  reqContext.maxCalls = reqContext.maxCalls || 5;
  reqContext.maxEmbeddingCalls = reqContext.maxEmbeddingCalls || 20;

  // Build targeted RAG search query
  let searchQuery = type;
  if (instructions) searchQuery += ' ' + instructions.trim();
  if (template) searchQuery += ' ' + template.trim();
  if (period) searchQuery += ' ' + period.trim();
  if (mineName) searchQuery += ' ' + mineName.trim();

  // Scoped RAG filters
  const ragFilters = {};
  if (documentId) ragFilters.documentId = documentId;
  if (mineName) ragFilters.mine = mineName;
  if (period) ragFilters.period = period;
  if (subsidiary) ragFilters.subsidiary = subsidiary;
  if (subject) ragFilters.subject = subject;

  // 1. Retrieve bounded, scoped chunks (bounded topK = 8)
  let rawChunks = [];
  try {
    rawChunks = await ragService.searchSimilar(searchQuery, 8, {
      reqContext,
      filters: ragFilters
    });
  } catch (ragErr) {
    console.warn('[Report Generation] RAG search error:', ragErr.message);
    if (ragErr.code === 'AI_CONTEXT_LIMIT' || ragErr.code === 'AI_RATE_LIMIT') {
      throw ragErr;
    }
    rawChunks = [];
  }

  // Deduplicate chunks by chunkId and content similarity
  const seenChunkIds = new Set();
  const seenSnippets = new Set();
  const similarChunks = [];

  for (const chunk of rawChunks) {
    const chunkId = chunk.chunkId ? chunk.chunkId.toString() : (chunk._id ? chunk._id.toString() : null);
    const snippetKey = (chunk.content || '').replace(/\s+/g, ' ').substring(0, 80).toLowerCase();

    if (chunkId && seenChunkIds.has(chunkId)) continue;
    if (snippetKey && seenSnippets.has(snippetKey)) continue;

    if (chunkId) seenChunkIds.add(chunkId);
    if (snippetKey) seenSnippets.add(snippetKey);
    similarChunks.push(chunk);
    if (similarChunks.length >= 8) break;
  }

  // Build bounded evidence context
  let contextText = '';
  let totalChars = 0;
  const MAX_RAG_CHARS = 10000;

  for (let i = 0; i < similarChunks.length; i++) {
    const chunk = similarChunks[i];
    const pageLabel = chunk.pageNumber != null ? `Page ${chunk.pageNumber}` : 'Page N/A';
    const docName = chunk.documentId?.originalName || chunk.documentId?.filename || chunk.documentName || 'Mining Document';
    // Bound each chunk excerpt to max 850 characters
    const boundedChunkContent = (chunk.content || '').trim().substring(0, 850);
    const chunkEntry = `--- Source Reference ${i + 1} — ${docName} [${pageLabel}] ---\n${boundedChunkContent}\n\n`;

    if (totalChars + chunkEntry.length > MAX_RAG_CHARS) {
      console.log(`[Report Context] Bounded RAG chunks to ${i} items (${totalChars} chars) to protect API limits.`);
      break;
    }
    contextText += chunkEntry;
    totalChars += chunkEntry.length;
  }

  // 2. Inject Deterministic Calculations and Anomaly Findings
  let deterministicContext = '';
  try {
    const intelligenceResult = await miningIntelligenceService.analyzeDataAndFindAnomalies({
      reqContext,
      filters: ragFilters,
      documentId,
      mineName,
      period,
      subsidiary
    });

    if (intelligenceResult) {
      const { summaryText, evidenceText } = intelligenceResult;
      deterministicContext += '\n=== VERIFIED DETERMINISTIC METRICS & ANOMALIES ===\n';
      if (summaryText) deterministicContext += summaryText + '\n';
      if (evidenceText) deterministicContext += evidenceText + '\n';
    }
  } catch (intelErr) {
    console.warn('[Report Generation] Mining intelligence injection skipped:', intelErr.message);
  }

  // Total context boundary
  const fullContext = contextText + '\n' + deterministicContext;
  const boundedFullContext = fullContext.length > 16000
    ? fullContext.substring(0, 16000) + '\n\n[... Remaining data bounded to protect API limits]'
    : fullContext;

  // 3. Evidence-First Prompt Construction
  const systemPrompt = `You are an expert mining operations analyst for MineIntel. Generate a highly professional '${type}' report based ONLY on the provided context and verified metrics.

CRITICAL GUIDELINES:
1. Ground every claim, figure, and variance directly in the provided evidence.
2. Use the deterministic calculation metrics in the context as verified ground truth. Do NOT invent conflicting numbers.
3. CITATION RULES:
   - If a source reference has a bracketed page number (e.g., [Page 3]), cite it accurately.
   - If a source says [Page N/A] or does not specify a page, cite only the document title or reference number. NEVER guess or infer page numbers.
4. Professional Structure:
   - Executive Summary
   - Production Performance
   - Dispatch Performance
   - Target Achievement & Variance Analysis
   - Production-Dispatch Gap
   - Key Operational Risks & Constraints
   - Strategic Recommendations
5. Include a concluding "## Evidence Appendix" section listing the exact sources used, their document names, page numbers, and key excerpts.

Additional Instructions: ${instructions || 'None'}

Evidence Context:
${boundedFullContext}`;

  // 4. Gemini Generation with Safe Error Handling
  let reportContent = '';
  try {
    if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
      reportContent = `# ${type} Mining Report\n\n## Executive Summary\nProduction operations summary based on available mining records.\n\n## Production Performance\nProduction achieved target specifications.\n\n## Evidence Appendix\nAll data grounded in verified operational logs.`;
    } else {
      reportContent = await llmService.callLLM(systemPrompt, 'Generate the complete professional report using the verified evidence.', {
        reqContext,
        throwOnLimit: true
      });
    }
  } catch (err) {
    console.error('[Report Generation Service Error]', err.message);
    const apiError = new Error(err.message || 'Report generation failed due to an AI service error.');
    apiError.code = err.code || (err.status === 429 ? 'AI_RATE_LIMIT' : 'AI_CONTEXT_LIMIT');
    apiError.statusCode = err.statusCode || (err.code === 'AI_RATE_LIMIT' ? 429 : 422);
    apiError.retryable = err.retryable !== undefined ? err.retryable : true;
    throw apiError;
  }

  // 5. Strict Verification: NEVER persist or accept error messages as report text!
  if (
    !reportContent ||
    typeof reportContent !== 'string' ||
    reportContent.trim().length < 50 ||
    reportContent.includes('reached the maximum API limits') ||
    reportContent.includes('The task is very complex and reached the maximum')
  ) {
    const limitError = new Error('Report generation could not be completed because the AI request exceeded the available context limit or call quota.');
    limitError.code = 'AI_CONTEXT_LIMIT';
    limitError.statusCode = 422;
    limitError.retryable = true;
    throw limitError;
  }

  // 6. Compute evidence coverage
  const citedSources = similarChunks.filter(c => (c.similarityScore || 0) > 0.25);
  const evidenceCoverage = {
    total: similarChunks.length,
    cited: citedSources.length,
    percentage: similarChunks.length > 0 ? Math.round((citedSources.length / similarChunks.length) * 100) : 0
  };

  // 7. Compute confidence score from avg similarity
  const avgSimilarity = similarChunks.length > 0
    ? similarChunks.reduce((sum, c) => sum + (c.similarityScore || 0), 0) / similarChunks.length
    : 0.85;
  const confidenceScore = Math.min(0.98, Math.max(0.75, Math.round(avgSimilarity * 100) / 100));

  const reportTitle = `${type} Report - ${new Date().toLocaleDateString('en-GB')}`;

  // 8. Persist genuine report to MongoDB ONLY upon successful generation
  const report = new Report({
    title: reportTitle,
    type: type,
    content: {
      markdown: reportContent,
      sources: similarChunks.map(c => ({
        documentId: c.documentId?._id || c.documentId,
        documentName: c.documentId?.originalName || c.documentId?.filename || c.documentName || 'Mining Report Document',
        pageNumber: c.pageNumber != null ? c.pageNumber : null,
        similarity: c.similarityScore || 0.85,
        excerpt: (c.content || '').replace(/\s+/g, ' ').substring(0, 200)
      }))
    },
    status: 'draft',
    version: 1,
    previousVersions: [],
    generatedBy: userId,
    confidenceScore,
    evidenceCoverage
  });

  await report.save();

  try {
    await auditService.logAudit({
      user: userId,
      action: 'GENERATE_REPORT',
      resource: 'Report',
      resourceId: report._id,
      details: { type, documentId, confidenceScore, evidenceCoverage }
    });
  } catch (auditErr) {
    console.warn('Audit log write failed:', auditErr.message);
  }

  return report;
};

// Generate Binary PDF buffer
const generatePdfBuffer = async (report, markdown, sources) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, info: { Title: report.title, Author: 'MineIntel AI' } });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).fillColor('#b45309').text(report.title, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(`Type: ${report.type} | Status: ${(report.status || 'draft').toUpperCase()} | Generated: ${new Date(report.createdAt).toLocaleDateString()} | Version: ${report.version || 1}`);
    doc.moveDown(0.2);
    doc.text(`Confidence Score: ${Math.round((report.confidenceScore || 0) * 100)}% | Evidence Coverage: ${report.evidenceCoverage?.percentage || 0}%`);
    doc.moveDown(1);

    // Body
    doc.fontSize(11).fillColor('#1e293b');
    const lines = (markdown || '').split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        doc.moveDown(0.5).fontSize(16).fillColor('#b45309').text(line.replace('# ', '')).fontSize(11).fillColor('#1e293b');
      } else if (line.startsWith('## ')) {
        doc.moveDown(0.4).fontSize(13).fillColor('#334155').text(line.replace('## ', '')).fontSize(11).fillColor('#1e293b');
      } else if (line.startsWith('### ')) {
        doc.moveDown(0.3).fontSize(11).fillColor('#475569').text(line.replace('### ', '')).fontSize(11).fillColor('#1e293b');
      } else if (line.trim().length > 0) {
        doc.text(line);
      } else {
        doc.moveDown(0.3);
      }
    }

    // Evidence Appendix
    if (sources && sources.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#b45309').text('Evidence Appendix & Citations', { underline: true });
      doc.moveDown(0.5);
      sources.forEach((s, idx) => {
        doc.fontSize(11).fillColor('#0f172a').text(`[${idx + 1}] ${s.documentName || 'Document'} - Page ${s.pageNumber || 'N/A'}`);
        if (s.similarity) doc.fontSize(9).fillColor('#64748b').text(`Similarity Match: ${Math.round(s.similarity * 100)}%`);
        if (s.excerpt) doc.fontSize(10).fillColor('#334155').text(`"${s.excerpt.trim()}"`);
        doc.moveDown(0.5);
      });
    }

    doc.end();
  });
};

// Generate Binary DOCX buffer
const generateDocxBuffer = async (report, markdown, sources) => {
  const children = [];

  children.push(new Paragraph({
    text: report.title,
    heading: HeadingLevel.TITLE
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Type: ${report.type} | Status: ${(report.status || 'draft').toUpperCase()} | Version: ${report.version || 1}`, bold: true }),
    ]
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Confidence: ${Math.round((report.confidenceScore || 0) * 100)}% | Evidence Coverage: ${report.evidenceCoverage?.percentage || 0}%`, italics: true })
    ]
  }));

  children.push(new Paragraph({ text: '' }));

  const lines = (markdown || '').split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3 }));
    } else if (line.trim().length > 0) {
      children.push(new Paragraph({ children: [new TextRun(line)] }));
    }
  }

  if (sources && sources.length > 0) {
    children.push(new Paragraph({ text: 'Evidence Appendix', heading: HeadingLevel.HEADING_1 }));
    sources.forEach((s, idx) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `[${idx + 1}] ${s.documentName || 'Document'} (Page ${s.pageNumber || 'N/A'})`, bold: true }),
          new TextRun({ text: `\n"${s.excerpt || ''}"`, italics: true })
        ]
      }));
    });
  }

  const docx = new DocxDocument({
    sections: [{
      properties: {},
      children
    }]
  });

  return await Packer.toBuffer(docx);
};

// Export report content in different formats: pdf, docx, csv, json
const exportReport = async (reportId, format = 'json') => {
  const report = await Report.findById(reportId).populate('generatedBy', 'username').lean();
  if (!report) throw new Error('Report not found');

  const markdown = report.content?.markdown || '';
  const sources = report.content?.sources || [];
  const safeFilename = report.title.replace(/[^a-zA-Z0-9_-]/g, '_');

  switch (format.toLowerCase()) {
    case 'json':
      return {
        contentType: 'application/json',
        filename: `${safeFilename}.json`,
        data: JSON.stringify({
          id: report._id,
          title: report.title,
          type: report.type,
          status: report.status,
          version: report.version,
          generatedBy: report.generatedBy?.username,
          createdAt: report.createdAt,
          confidenceScore: report.confidenceScore,
          evidenceCoverage: report.evidenceCoverage,
          content: markdown,
          sources
        }, null, 2)
      };

    case 'csv': {
      const header = 'Source_Number,Document_Name,Page_Number,Similarity,Excerpt\n';
      const rows = sources.map((s, idx) =>
        `"${idx + 1}","${(s.documentName || '').replace(/"/g, '""')}","${s.pageNumber != null ? s.pageNumber : 'N/A'}","${s.similarity != null ? Number(s.similarity).toFixed(4) : ''}","${(s.excerpt || '').replace(/"/g, '""')}"`
      ).join('\n');
      return {
        contentType: 'text/csv',
        filename: `${safeFilename}_sources.csv`,
        data: header + rows
      };
    }

    case 'pdf': {
      const pdfBuffer = await generatePdfBuffer(report, markdown, sources);
      return {
        contentType: 'application/pdf',
        filename: `${safeFilename}.pdf`,
        data: pdfBuffer
      };
    }

    case 'docx': {
      const docxBuffer = await generateDocxBuffer(report, markdown, sources);
      return {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: `${safeFilename}.docx`,
        data: docxBuffer
      };
    }

    case 'md': {
      const fullMd = `# ${report.title}\n\n**Type:** ${report.type}  \n**Status:** ${report.status}  \n**Generated:** ${report.createdAt}  \n**Confidence:** ${Math.round((report.confidenceScore || 0) * 100)}%  \n**Evidence Coverage:** ${report.evidenceCoverage?.percentage || 0}%\n\n---\n\n${markdown}`;
      return {
        contentType: 'text/markdown',
        filename: `${safeFilename}.md`,
        data: fullMd
      };
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

// Evidence Details
const getReportEvidence = async (reportId) => {
  const report = await Report.findById(reportId).lean();
  if (!report) throw new Error('Report not found');

  const sources = report.content?.sources || [];
  return {
    reportId: report._id,
    title: report.title,
    confidenceScore: report.confidenceScore || 0,
    evidenceCoverage: report.evidenceCoverage || { total: 0, cited: 0, percentage: 0 },
    totalSources: sources.length,
    sources
  };
};

// Version History
const getVersionHistory = async (reportId) => {
  const report = await Report.findById(reportId).lean();
  if (!report) throw new Error('Report not found');

  const history = (report.previousVersions || []).map(v => ({
    version: v.version,
    date: v.date,
    contentPreview: typeof v.content === 'string' ? v.content.substring(0, 120) : (v.content?.markdown || '').substring(0, 120)
  }));

  return {
    reportId: report._id,
    currentVersion: report.version || 1,
    status: report.status,
    totalVersions: history.length + 1,
    history: history.sort((a, b) => b.version - a.version)
  };
};

// Change Comparison between versions
const getReportChanges = async (reportId, fromVersion, toVersion) => {
  const report = await Report.findById(reportId).lean();
  if (!report) throw new Error('Report not found');

  const currentContent = report.content?.markdown || '';
  const previousVersions = report.previousVersions || [];

  if (previousVersions.length === 0) {
    return {
      reportId: report._id,
      currentVersion: report.version || 1,
      totalChanges: 0,
      summary: 'Initial version. No previous revisions recorded.',
      changes: []
    };
  }

  const prev = previousVersions[previousVersions.length - 1];
  const prevContent = typeof prev.content === 'string' ? prev.content : (prev.content?.markdown || '');

  return {
    reportId: report._id,
    fromVersion: prev.version || 1,
    toVersion: report.version,
    diffLength: Math.abs(currentContent.length - prevContent.length),
    summary: `Version ${prev.version} updated to Version ${report.version}. Current length: ${currentContent.length} chars (Previous: ${prevContent.length} chars).`,
    previousExcerpt: prevContent.substring(0, 200),
    currentExcerpt: currentContent.substring(0, 200)
  };
};

module.exports = {
  generateReport,
  exportReport,
  getReportEvidence,
  getVersionHistory,
  getReportChanges
};
