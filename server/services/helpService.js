/**
 * Help & Support Service
 * Grounded operational guides, FAQ catalog, and search functionality.
 */

const GUIDES = [
  {
    id: 'upload',
    category: 'Extraction',
    title: 'How to Upload & Extract Documents',
    summary: 'Ingest PDF, Word, Excel, and image documents for automated OCR and tabular parameter extraction.',
    steps: [
      'Navigate to "Data Extraction" from the sidebar.',
      'Click "Upload Document" and select a PDF, DOCX, XLSX or image file.',
      'The system automatically queues the document for AI-powered extraction.',
      'Processing status is shown in real-time. Once complete, extracted data appears in the review panel.',
      'You can retry failed documents or upload multiple files using batch upload.',
      'Extracted records include parameters, values, periods and confidence scores.'
    ]
  },
  {
    id: 'validation',
    category: 'Validation',
    title: 'How Validation Works',
    summary: 'Quality score calculation, conflict detection, and human-in-the-loop review workflow.',
    steps: [
      'After extraction, navigate to "Validation" to review extracted data quality.',
      'Each extracted record shows a confidence score indicating extraction reliability.',
      'Records flagged with low confidence require manual review.',
      'You can approve, reject or correct individual extracted values.',
      'Validation results feed into analytics and report generation quality metrics.',
      'Resolved validations are tracked in the audit trail.'
    ]
  },
  {
    id: 'knowledge',
    category: 'Knowledge Base',
    title: 'How Knowledge Base / RAG Works',
    summary: 'Vector embeddings, chunking, and semantic search across the mining document corpus.',
    steps: [
      'The Knowledge Base stores all processed documents and their extracted content.',
      'Documents are indexed using vector embeddings for semantic search (RAG).',
      'Navigate to "Knowledge Base" to browse, search and manage indexed documents.',
      'The AI Assistant and Report Generator use this indexed knowledge to answer questions and generate reports.',
      'Higher quality extractions and validations improve RAG retrieval accuracy.'
    ]
  },
  {
    id: 'assistant',
    category: 'AI Assistant',
    title: 'How to Use AI Assistant',
    summary: 'Evidence-grounded mining Q&A, citations, and why-analysis.',
    steps: [
      'Navigate to "AI Assistant" from the sidebar.',
      'Type natural language questions about your mining data in the chat input.',
      'The assistant uses RAG to search your indexed documents and provide evidence-based answers.',
      'Responses include source citations so you can verify the information.',
      'You can ask follow-up questions to refine or expand on previous answers.',
      'The assistant works best when your documents have been fully extracted and validated.'
    ]
  },
  {
    id: 'reports',
    category: 'Reports',
    title: 'How to Generate & Submit Reports',
    summary: 'AI-assisted report generation with evidence appendix and export capabilities.',
    steps: [
      'Navigate to "Reports" from the sidebar.',
      'Select a source document (or use all indexed documents) and choose a report type.',
      'Optionally add specific instructions to focus the report content.',
      'Click "Generate Report" to create an AI-powered report with evidence citations.',
      'Review the generated report in the preview panel.',
      'Use the export buttons to download as DOCX, CSV or JSON format.',
      'Click "Submit for Review" to send the report to an admin for approval.',
      'Track report status (Draft -> Review -> Approved/Rejected) in the reports list.'
    ]
  },
  {
    id: 'admin',
    category: 'Governance',
    title: 'How Admin Review & Approval Works',
    summary: 'Supervisor approval queue, feedback rejection, and compliance audit trail.',
    steps: [
      'Admin users can access "Pending Reviews" from the sidebar.',
      'Submitted reports appear in the review queue with their metadata and confidence scores.',
      'Admins can read the full report content before making a decision.',
      'Reports can be approved (published) or rejected with feedback comments.',
      'All review actions are logged in the Audit Trail for compliance.',
      'Admins can also manage users, view system health and access analytics.'
    ]
  }
];

const FAQS = [
  {
    id: 'faq-upload-formats',
    category: 'Documents',
    question: 'What file formats are supported for upload?',
    answer: 'MineIntel AI supports PDF, DOCX, XLSX, PPTX, CSV and common image formats (PNG, JPG, TIFF). PDF is recommended for best extraction accuracy.'
  },
  {
    id: 'faq-processing-time',
    category: 'Processing',
    question: 'How long does document processing take?',
    answer: 'Processing time depends on document size and complexity. Most single-page documents are processed within 30-60 seconds. Larger multi-page documents may take several minutes.'
  },
  {
    id: 'faq-re-extraction',
    category: 'Extraction',
    question: 'Can I re-extract a document that failed?',
    answer: 'Yes. Navigate to Data Extraction, find the failed document and click the retry button. The document will be re-queued for processing.'
  },
  {
    id: 'faq-ai-accuracy',
    category: 'Validation',
    question: 'How accurate is the AI extraction?',
    answer: 'Accuracy depends on document quality and formatting. Well-structured documents typically achieve 85-95% extraction accuracy. The confidence score on each record indicates reliability.'
  },
  {
    id: 'faq-report-approval',
    category: 'Reports',
    question: 'Who can approve submitted reports?',
    answer: 'Only users with the Admin role can approve or reject submitted reports. Regular users can generate and submit reports for review.'
  },
  {
    id: 'faq-password-settings',
    category: 'Settings',
    question: 'How do I change my password or profile settings?',
    answer: 'Navigate to Settings from the sidebar. You can update your profile information, language preferences and notification settings from there.'
  },
  {
    id: 'faq-analytics-dashboard',
    category: 'Analytics',
    question: 'What does the Analytics dashboard show?',
    answer: 'The Analytics dashboard displays production trends, dispatch tracking, target achievement and AI-generated insights - all calculated dynamically from your extracted document data.'
  },
  {
    id: 'faq-export-data',
    category: 'Reports',
    question: 'Can I export data from the platform?',
    answer: 'Yes. Reports can be exported as DOCX, CSV, JSON or PDF. The Analytics dashboard displays data from your extracted records which can be exported via reports.'
  },
  {
    id: 'faq-audit-trail',
    category: 'Governance',
    question: 'What is the Audit Trail?',
    answer: 'The Audit Trail logs all significant actions in the system including document uploads, report submissions, review decisions and user management changes for compliance and accountability.'
  },
  {
    id: 'faq-intelligence-module',
    category: 'Intelligence',
    question: 'How does the Intelligence module work?',
    answer: 'The Intelligence module provides AI-powered trend analysis, anomaly detection and cross-document insights across your entire mining data corpus.'
  }
];

// 1. Get help overview
const getHelpOverview = async () => {
  return {
    title: 'MineIntel AI Knowledge & Support Center',
    description: 'Documentation, operational guides, and frequently asked questions for mining intelligence workflows.',
    totalGuides: GUIDES.length,
    totalFaqs: FAQS.length,
    guideCategories: [...new Set(GUIDES.map(g => g.category))],
    guides: GUIDES.map(g => ({
      id: g.id,
      category: g.category,
      title: g.title,
      summary: g.summary
    })),
    popularFaqs: FAQS.slice(0, 4),
    supportContact: {
      email: 'support@mineintel.org',
      organization: 'CMPDI / Coal India Limited',
      hours: 'Mon-Fri, 9:00 AM - 6:00 PM IST'
    }
  };
};

// 2. Get FAQ list with optional category filter
const getFaqs = async (category) => {
  if (category) {
    const filtered = FAQS.filter(f => f.category.toLowerCase() === category.toLowerCase());
    return {
      total: filtered.length,
      category,
      faqs: filtered
    };
  }

  return {
    total: FAQS.length,
    categories: [...new Set(FAQS.map(f => f.category))],
    faqs: FAQS
  };
};

// 3. Get single FAQ by ID
const getFaqById = async (id) => {
  const faq = FAQS.find(f => f.id.toLowerCase() === id.toLowerCase());
  if (!faq) {
    // Also try numeric index fallback
    const idx = parseInt(id) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < FAQS.length) {
      return FAQS[idx];
    }
    throw new Error(`FAQ with ID "${id}" not found`);
  }
  return faq;
};

// 4. Search FAQs and Guides
const searchHelp = async (query) => {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      query: '',
      resultsCount: 0,
      matchedFaqs: [],
      matchedGuides: []
    };
  }

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  const matchedFaqs = FAQS.filter(faq => {
    const text = `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase();
    return terms.some(term => text.includes(term));
  });

  const matchedGuides = GUIDES.filter(guide => {
    const text = `${guide.title} ${guide.summary} ${guide.category} ${guide.steps.join(' ')}`.toLowerCase();
    return terms.some(term => text.includes(term));
  });

  return {
    query,
    resultsCount: matchedFaqs.length + matchedGuides.length,
    matchedFaqs,
    matchedGuides
  };
};

module.exports = {
  getHelpOverview,
  getFaqs,
  getFaqById,
  searchHelp,
  GUIDES,
  FAQS
};
