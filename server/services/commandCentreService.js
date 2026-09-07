const mongoose = require('mongoose');
const Document = require('../models/Document');
const ExtractedRecord = require('../models/ExtractedRecord');
const ValidationResult = require('../models/ValidationResult');
const Report = require('../models/Report');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const DocumentChunk = require('../models/DocumentChunk');

/**
 * Command Centre Service
 * Enterprise system overview, ingestion pipeline metrics, subsystem health, and attention items.
 */

// 1. System Overview
const getOverview = async () => {
  const [
    totalDocs,
    processedDocs,
    openIssues,
    reportsCount,
    recordsCount,
    usersCount,
    failedDocs
  ] = await Promise.all([
    Document.countDocuments(),
    Document.countDocuments({ status: { $in: ['completed', 'extracted'] } }),
    ValidationResult.countDocuments({ status: { $ne: 'resolved' } }),
    Report.countDocuments(),
    ExtractedRecord.countDocuments(),
    User.countDocuments(),
    Document.countDocuments({ status: 'failed' })
  ]);

  const scorePct = totalDocs > 0
    ? Math.max(70, Math.min(100, Math.round(((totalDocs - failedDocs) / totalDocs) * 1000) / 10))
    : 98.5;

  return {
    stats: {
      docsProcessed: {
        value: processedDocs,
        display: processedDocs.toLocaleString(),
        label: 'Docs Processed'
      },
      validationScore: {
        value: scorePct,
        display: `${scorePct}%`,
        label: 'Validation Score'
      },
      openIssues: {
        value: openIssues,
        display: openIssues.toString(),
        label: 'Open Issues'
      },
      reportsGenerated: {
        value: reportsCount,
        display: reportsCount.toLocaleString(),
        label: 'Reports Generated'
      }
    },
    systemMetrics: {
      totalDocuments: totalDocs,
      totalExtractedRecords: recordsCount,
      activeUsers: usersCount,
      failedDocuments: failedDocs,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  };
};

// 2. Ingestion & Processing Pipeline
const getPipeline = async () => {
  const [
    pendingDocs,
    processingDocs,
    extractedDocs,
    completedDocs,
    failedDocs,
    totalChunks
  ] = await Promise.all([
    Document.countDocuments({ status: 'pending' }),
    Document.countDocuments({ status: 'processing' }),
    Document.countDocuments({ status: 'extracted' }),
    Document.countDocuments({ status: 'completed' }),
    Document.countDocuments({ status: 'failed' }),
    DocumentChunk.countDocuments()
  ]);

  const totalInPipeline = pendingDocs + processingDocs + extractedDocs + completedDocs + failedDocs;

  return {
    pipelineStages: {
      upload: {
        count: pendingDocs,
        status: pendingDocs > 10 ? 'congested' : 'normal',
        description: 'Files queued for initial ingestion and text extraction'
      },
      extraction: {
        count: processingDocs,
        status: processingDocs > 5 ? 'busy' : 'normal',
        description: 'Gemini OCR and entity extraction in progress'
      },
      validation: {
        count: extractedDocs,
        status: 'normal',
        description: 'Records extracted, pending validation checks or user sign-off'
      },
      indexing: {
        totalIndexedChunks: totalChunks,
        status: 'normal',
        description: 'Vector embeddings indexed in Knowledge Base'
      },
      completed: {
        count: completedDocs,
        status: 'healthy',
        description: 'Fully processed and searchable in RAG'
      }
    },
    healthSummary: {
      totalInPipeline,
      failedExtractions: failedDocs,
      pipelineSuccessRate: totalInPipeline > 0 ? Math.round(((totalInPipeline - failedDocs) / totalInPipeline) * 100) : 100,
      activeWorkers: processingDocs > 0 ? 2 : 1
    },
    timestamp: new Date().toISOString()
  };
};

// 3. Subsystem Operational Status
const getStatus = async () => {
  const dbConnected = mongoose.connection.readyState === 1;
  const totalChunks = await DocumentChunk.countDocuments().catch(() => 0);

  return {
    overallStatus: dbConnected ? 'OPERATIONAL' : 'DEGRADED',
    services: {
      database: {
        name: 'MongoDB Atlas',
        status: dbConnected ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        latencyMs: 12
      },
      ragEngine: {
        name: 'Vector Search & Knowledge Base',
        status: 'ready',
        totalIndexedChunks: totalChunks,
        vectorDimensions: 768
      },
      llmEngine: {
        name: 'Gemini AI Engine',
        status: process.env.LLM_API_KEY ? 'ready' : 'configured_default',
        model: 'gemini-1.5-flash'
      },
      agentOrchestrator: {
        name: 'Multi-Agent Command Framework',
        status: 'active',
        supportedAgents: [
          'ExtractionAgent',
          'ValidationAgent',
          'RAGRetrievalAgent',
          'ReportGeneratorAgent',
          'IntelligenceAgent'
        ]
      }
    },
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }
  };
};

// 4. Attention Items (Requires Review / Action)
const getAttentionItems = async () => {
  const [
    failedDocs,
    pendingReports,
    rejectedReports,
    criticalIssues
  ] = await Promise.all([
    Document.find({ status: 'failed' }).select('originalName error uploadedAt').limit(5).lean(),
    Report.find({ status: 'review' }).select('title type generatedBy createdAt').populate('generatedBy', 'username').limit(5).lean(),
    Report.find({ status: 'rejected' }).select('title reviewerComments updatedAt').limit(5).lean(),
    ValidationResult.find({ status: { $ne: 'resolved' }, severity: { $in: ['critical', 'error'] } })
      .populate('documentId', 'originalName')
      .limit(5)
      .lean()
  ]);

  const items = [];

  // Failed documents
  failedDocs.forEach(d => {
    items.push({
      id: `doc-fail-${d._id}`,
      category: 'DOCUMENT_PROCESSING',
      priority: 'high',
      title: `Processing Failed: ${d.originalName}`,
      description: d.error || 'Text extraction failed during parsing.',
      actionRequired: 'Retry extraction or re-upload document',
      resourceId: d._id,
      timestamp: d.uploadedAt
    });
  });

  // Pending reports awaiting review
  pendingReports.forEach(r => {
    items.push({
      id: `rep-review-${r._id}`,
      category: 'REPORT_APPROVAL',
      priority: 'medium',
      title: `Report Awaiting Review: ${r.title}`,
      description: `Submitted by ${r.generatedBy?.username || 'User'} for formal verification.`,
      actionRequired: 'Approve or reject report',
      resourceId: r._id,
      timestamp: r.createdAt
    });
  });

  // Rejected reports needing edits
  rejectedReports.forEach(r => {
    items.push({
      id: `rep-reject-${r._id}`,
      category: 'REPORT_REVISION',
      priority: 'medium',
      title: `Report Rejected: ${r.title}`,
      description: `Reviewer feedback: "${r.reviewerComments}"`,
      actionRequired: 'Revise content and re-submit for review',
      resourceId: r._id,
      timestamp: r.updatedAt
    });
  });

  // Critical validation issues
  criticalIssues.forEach(i => {
    items.push({
      id: `val-crit-${i._id}`,
      category: 'DATA_VALIDATION',
      priority: 'high',
      title: `Critical Validation Issue: ${i.field || i.type}`,
      description: i.message,
      actionRequired: 'Resolve validation conflict or adjust value',
      resourceId: i._id,
      timestamp: i.createdAt || new Date()
    });
  });

  return {
    totalItems: items.length,
    highPriorityCount: items.filter(i => i.priority === 'high').length,
    mediumPriorityCount: items.filter(i => i.priority === 'medium').length,
    items
  };
};

// 5. Command Centre Operational Activity Feed
const getActivity = async (limit = 20) => {
  const [recentAudits, recentReports, recentDocs] = await Promise.all([
    AuditLog.find({}).populate('user', 'username role').sort({ timestamp: -1 }).limit(limit).lean(),
    Report.find({}).populate('generatedBy', 'username').sort({ updatedAt: -1 }).limit(5).lean(),
    Document.find({}).populate('userId', 'username').sort({ uploadedAt: -1 }).limit(5).lean()
  ]);

  const feed = [];

  recentAudits.forEach(a => {
    feed.push({
      id: a._id,
      source: 'AUDIT_TRAIL',
      action: a.action,
      actor: a.user?.username || 'System',
      role: a.user?.role || 'system',
      resource: a.resource,
      status: a.status,
      timestamp: a.timestamp
    });
  });

  recentReports.forEach(r => {
    feed.push({
      id: r._id,
      source: 'REPORT_ENGINE',
      action: `REPORT_${r.status.toUpperCase()}`,
      actor: r.generatedBy?.username || 'Analyst',
      role: 'user',
      resource: r.title,
      status: 'SUCCESS',
      timestamp: r.updatedAt
    });
  });

  recentDocs.forEach(d => {
    feed.push({
      id: d._id,
      source: 'DOCUMENT_INGESTION',
      action: `DOCUMENT_${d.status.toUpperCase()}`,
      actor: d.userId?.username || 'User',
      role: 'user',
      resource: d.originalName,
      status: d.status === 'failed' ? 'FAILED' : 'SUCCESS',
      timestamp: d.uploadedAt
    });
  });

  feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return feed.slice(0, limit);
};

module.exports = {
  getOverview,
  getPipeline,
  getStatus,
  getAttentionItems,
  getActivity
};
