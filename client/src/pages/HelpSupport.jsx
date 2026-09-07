import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Search, ChevronDown, ChevronRight, BookOpen, 
  Upload, ShieldCheck, Database, MessageSquare, FileOutput, 
  Users, Mail
} from 'lucide-react';
import helpApi from '../api/helpApi';

const guides = [
  {
    id: 'upload',
    icon: Upload,
    title: 'How to Upload & Extract Documents',
    content: [
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
    icon: ShieldCheck,
    title: 'How Validation Works',
    content: [
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
    icon: Database,
    title: 'How Knowledge Base / RAG Works',
    content: [
      'The Knowledge Base stores all processed documents and their extracted content.',
      'Documents are indexed using vector embeddings for semantic search (RAG).',
      'Navigate to "Knowledge Base" to browse, search and manage indexed documents.',
      'The AI Assistant and Report Generator use this indexed knowledge to answer questions and generate reports.',
      'Higher quality extractions and validations improve RAG retrieval accuracy.'
    ]
  },
  {
    id: 'assistant',
    icon: MessageSquare,
    title: 'How to Use AI Assistant',
    content: [
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
    icon: FileOutput,
    title: 'How to Generate & Submit Reports',
    content: [
      'Navigate to "Reports" from the sidebar.',
      'Select a source document (or use all indexed documents) and choose a report type.',
      'Optionally add specific instructions to focus the report content.',
      'Click "Generate Report" to create an AI-powered report with evidence citations.',
      'Review the generated report in the preview panel.',
      'Use the export buttons to download as DOCX, CSV or JSON format.',
      'Click "Submit for Review" to send the report to an admin for approval.',
      'Track report status (Draft → Review → Approved/Rejected) in the reports list.'
    ]
  },
  {
    id: 'admin',
    icon: Users,
    title: 'How Admin Review & Approval Works',
    content: [
      'Admin users can access "Pending Reviews" from the sidebar.',
      'Submitted reports appear in the review queue with their metadata and confidence scores.',
      'Admins can read the full report content before making a decision.',
      'Reports can be approved (published) or rejected with feedback comments.',
      'All review actions are logged in the Audit Trail for compliance.',
      'Admins can also manage users, view system health and access analytics.'
    ]
  }
];

const faqs = [
  { q: 'What file formats are supported for upload?', a: 'MineIntel AI supports PDF, DOCX, XLSX, PPTX, CSV and common image formats (PNG, JPG, TIFF). PDF is recommended for best extraction accuracy.' },
  { q: 'How long does document processing take?', a: 'Processing time depends on document size and complexity. Most single-page documents are processed within 30\u201360 seconds. Larger multi-page documents may take several minutes.' },
  { q: 'Can I re-extract a document that failed?', a: 'Yes. Navigate to Data Extraction, find the failed document and click the retry button. The document will be re-queued for processing.' },
  { q: 'How accurate is the AI extraction?', a: 'Accuracy depends on document quality and formatting. Well-structured documents typically achieve 85\u201395% extraction accuracy. The confidence score on each record indicates reliability.' },
  { q: 'Who can approve submitted reports?', a: 'Only users with the Admin role can approve or reject submitted reports. Regular users can generate and submit reports for review.' },
  { q: 'How do I change my password or profile settings?', a: 'Navigate to Settings from the sidebar. You can update your profile information, language preferences and notification settings from there.' },
  { q: 'What does the Analytics dashboard show?', a: 'The Analytics dashboard displays production trends, dispatch tracking, target achievement and AI-generated insights \u2014 all calculated dynamically from your extracted document data.' },
  { q: 'Can I export data from the platform?', a: 'Yes. Reports can be exported as DOCX, CSV or JSON. The Analytics dashboard displays data from your extracted records which can be exported via reports.' },
  { q: 'What is the Audit Trail?', a: 'The Audit Trail logs all significant actions in the system including document uploads, report submissions, review decisions and user management changes for compliance and accountability.' },
  { q: 'How does the Intelligence module work?', a: 'The Intelligence module provides AI-powered trend analysis, anomaly detection and cross-document insights across your entire mining data corpus.' }
];

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openGuides, setOpenGuides] = useState({});
  const [openFaqs, setOpenFaqs] = useState({});
  const [apiFaqs, setApiFaqs] = useState([]);

  useEffect(() => {
    const loadHelpData = async () => {
      try {
        const res = await helpApi.getFaqs();
        const list = res.data?.faqs || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map(item => ({
            q: item.question || item.q,
            a: item.answer || item.a
          }));
          setApiFaqs(formatted);
        }
      } catch (e) {
        // Fallback to offline faqs array
      }
    };
    loadHelpData();
  }, []);

  const toggleGuide = (id) => setOpenGuides(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleFaq = (idx) => setOpenFaqs(prev => ({ ...prev, [idx]: !prev[idx] }));

  const query = searchQuery.toLowerCase();
  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(query) || 
    g.content.some(c => c.toLowerCase().includes(query))
  );
  const activeFaqs = apiFaqs.length > 0 ? apiFaqs : faqs;
  const filteredFaqs = activeFaqs.filter(f => 
    f.q.toLowerCase().includes(query) || 
    f.a.toLowerCase().includes(query)
  );

  return (
    <div className="p-4 md:p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <HelpCircle className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Guides, FAQs and platform documentation.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search guides and FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
        />
      </div>

      {/* Getting Started */}
      {!searchQuery && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Upload Documents', desc: 'Go to Data Extraction and upload your mining documents (PDF, DOCX, XLSX).' },
              { step: '2', title: 'Review & Validate', desc: 'Check extracted data in Validation. Approve or correct flagged records.' },
              { step: '3', title: 'Generate Reports', desc: 'Use the Report Generator to create evidence-based reports from your data.' }
            ].map((s, i) => (
              <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-[#1c1f26] rounded-lg border border-slate-100 dark:border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guides */}
      {filteredGuides.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Platform Guides</h2>
          <div className="space-y-2">
            {filteredGuides.map((guide) => (
              <div key={guide.id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGuide(guide.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-[#ffffff05] transition-colors"
                >
                  <guide.icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{guide.title}</span>
                  {openGuides[guide.id] 
                    ? <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                  }
                </button>
                {openGuides[guide.id] && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                    <ol className="space-y-2 ml-7">
                      {guide.content.map((step, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed list-decimal">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {filteredFaqs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-3 px-1">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-[#ffffff05] transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white flex-1">{faq.q}</span>
                  {openFaqs[idx]
                    ? <ChevronDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                  }
                </button>
                {openFaqs[idx] && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && filteredGuides.length === 0 && filteredFaqs.length === 0 && (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-slate-400">No results found for &ldquo;{searchQuery}&rdquo;. Try a different search term.</p>
        </div>
      )}

      {/* Contact */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-amber-500" />
          Contact & Support
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          For technical support, platform issues or feature requests, please contact your organization&apos;s IT administrator or the MineIntel AI support team through your internal communication channels. Include your username, a description of the issue and any relevant screenshots to help resolve your request efficiently.
        </p>
      </div>
    </div>
  );
};

export default HelpSupport;
