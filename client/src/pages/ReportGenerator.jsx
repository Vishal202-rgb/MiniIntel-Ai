import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, RefreshCw, Loader2, Check, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import api from '../services/api';

const ReportGenerator = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [reportType, setReportType] = useState('Executive Summary');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/documents');
        setDocuments(res.data.data.filter(d => d.status === 'completed'));
      } catch (err) {
        console.error('Failed to load documents', err);
      }
    };
    fetchDocs();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setReport(null);
    
    try {
      const res = await api.post('/reports/generate', {
        type: reportType,
        data: {
          documentId: selectedDoc || null,
          instructions
        }
      });
      setReport(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while generating the report.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (report?.content?.markdown) {
      navigator.clipboard.writeText(report.content.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    if (!report) return;
    try {
      const res = await api.get(`/reports/${report._id}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const contentDisposition = res.headers['content-disposition'];
      let filename = `${report.title.replace(/\s+/g, '_')}.${format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export report. Please try again.');
    }
  };

  const getMarkdownParts = (markdown) => {
    if (!markdown) return { main: '', evidence: '' };
    const patterns = [
      /^(#+\s*(?:Evidence\s+Appendix|Appendix|Evidence\s+Sources|Source\s+Evidence|Citations?))\b/im
    ];
    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) {
        const idx = markdown.indexOf(match[0]);
        return {
          main: markdown.substring(0, idx).trim(),
          evidence: markdown.substring(idx).trim()
        };
      }
    }
    return { main: markdown, evidence: '' };
  };

  const markdownParts = report?.content?.markdown ? getMarkdownParts(report.content.markdown) : { main: '', evidence: '' };

  const inputClass = "w-full bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-[#f1f5f9] placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-[#64748b] uppercase tracking-wider mb-1.5";

  const mdComponents = {
    table: ({node, ...props}) => (
      <div className="overflow-x-auto my-4 border border-slate-200 dark:border-[#2d3139] rounded-lg">
        <table className="w-full text-left border-collapse m-0" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => (
      <thead className="bg-slate-50 dark:bg-[#1c1f26] text-gray-700 dark:text-[#94a3b8] border-b border-slate-200 dark:border-[#2d3139]" {...props} />
    ),
    th: ({node, children, ...props}) => {
      const text = String(children).toLowerCase();
      let widthClass = "px-3 py-2.5 font-semibold text-xs uppercase tracking-wider";
      if (text.includes('source') || text.includes('document') || text.includes('file')) widthClass += " w-[30%] min-w-[180px]";
      else if (text.includes('page')) widthClass += " w-[12%] min-w-[70px] text-center";
      else widthClass += " w-[58%] min-w-[250px]";
      return <th className={widthClass} {...props}>{children}</th>;
    },
    td: ({node, children, ...props}) => (
      <td className="px-3 py-2.5 align-top border-b border-slate-100 dark:border-[#2d3139]/60 text-sm leading-relaxed" {...props}>
        {typeof children === 'string' ? children.replace(/^["'`]|["'`]$/g, '') : children}
      </td>
    ),
    code: ({node, inline, children, ...props}) => (
      <code className={`${inline ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium text-xs break-words' : 'block bg-slate-50 dark:bg-[#1c1f26] p-3 rounded-lg overflow-x-auto text-sm border border-slate-200 dark:border-[#2d3139]'}`} {...props}>
        {children}
      </code>
    )
  };

  return (
    <div className="p-3 md:p-4 max-w-[1400px] mx-auto text-gray-800 dark:text-[#94a3b8]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Report Generator</h1>
          <p className="text-xs text-gray-500 dark:text-slate-500">Generate evidence-based mining intelligence reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Form Panel */}
        <div className="lg:col-span-4 xl:col-span-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 sticky top-20">
            
            <div>
              <label className={labelClass}>Source Document</label>
              <select 
                value={selectedDoc} 
                onChange={e => setSelectedDoc(e.target.value)}
                className={inputClass}
              >
                <option value="">All Indexed Documents</option>
                {documents.map(d => (
                  <option key={d._id} value={d._id}>{d.originalName || d.filename || d.title}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-1">Optional. Leave blank to use full knowledge base.</p>
            </div>

            <div>
              <label className={labelClass}>Report Type</label>
              <select 
                value={reportType} 
                onChange={e => setReportType(e.target.value)}
                className={inputClass}
              >
                <option>Executive Summary</option>
                <option>Production Analysis</option>
                <option>Operational Risk Report</option>
                <option>Production &amp; Dispatch Report</option>
                <option>Comprehensive Mining Report</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Instructions</label>
              <textarea 
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Focus on FY 2023 dispatch delays..."
                className={`${inputClass} h-20 resize-none`}
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8 xl:col-span-8">
          {report ? (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}>
              {/* Sticky Header */}
              <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50/80 dark:bg-[#1c1f26] shrink-0">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug break-words flex-1">
                    {report.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    report.status === 'draft' ? 'bg-slate-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300' :
                    report.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    report.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {report.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {report.status === 'draft' && (
                      <button 
                        onClick={async () => {
                          try {
                            const res = await api.put(`/reports/${report._id}/submit`);
                            setReport(res.data.data);
                          } catch (e) { alert(e.message); }
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap"
                      >
                        Submit for Review
                      </button>
                    )}
                    
                    {(report.confidenceScore || report.evidenceCoverage) && (
                      <div className="flex items-center gap-2 text-[11px] bg-slate-100 dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] px-2 py-1 rounded">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">
                          Confidence {Math.round((report.confidenceScore || 0) * 100)}%
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          Coverage {report.evidenceCoverage?.percentage || 0}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleExport('docx')} className="px-2 py-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff08] text-gray-600 dark:text-slate-400 text-[11px] font-medium rounded transition-colors flex items-center gap-1">
                      <Download className="w-3 h-3" /> DOCX
                    </button>
                    <button onClick={() => handleExport('csv')} className="px-2 py-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff08] text-gray-600 dark:text-slate-400 text-[11px] font-medium rounded transition-colors flex items-center gap-1">
                      <Download className="w-3 h-3" /> CSV
                    </button>
                    <button onClick={downloadJson} className="px-2 py-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff08] text-gray-600 dark:text-slate-400 text-[11px] font-medium rounded transition-colors flex items-center gap-1">
                      <Download className="w-3 h-3" /> JSON
                    </button>
                    <button onClick={copyToClipboard} className="p-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff08] rounded text-gray-600 dark:text-slate-400 transition-colors" title="Copy">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 md:p-5 overflow-y-auto grow custom-scrollbar">
                <div className="prose dark:prose-invert max-w-none prose-sm prose-headings:text-gray-900 dark:prose-headings:text-[#f1f5f9] prose-headings:font-semibold prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-code:before:content-none prose-code:after:content-none prose-p:text-gray-700 dark:prose-p:text-[#94a3b8] prose-li:text-gray-700 dark:prose-li:text-[#94a3b8] prose-strong:text-gray-900 dark:prose-strong:text-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={mdComponents}
                  >
                    {markdownParts.main || 'No content generated.'}
                  </ReactMarkdown>
                </div>
                
                {markdownParts.evidence && (
                  <div className="mt-6 border-t border-slate-200 dark:border-[#2d3139] pt-4">
                    <button
                      onClick={() => setEvidenceOpen(!evidenceOpen)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-[#94a3b8] hover:text-gray-900 dark:hover:text-white transition-colors mb-3"
                    >
                      {evidenceOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <Shield className="w-4 h-4 text-amber-500" />
                      Evidence Appendix
                    </button>
                    {evidenceOpen && (
                      <div className="prose dark:prose-invert max-w-none prose-sm prose-headings:text-gray-900 dark:prose-headings:text-[#f1f5f9] prose-headings:font-semibold prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-code:before:content-none prose-code:after:content-none prose-p:text-gray-700 dark:prose-p:text-[#94a3b8]">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          components={mdComponents}
                        >
                          {markdownParts.evidence}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center flex-col gap-3 text-center" style={{ height: 'calc(100vh - 120px)', minHeight: '400px' }}>
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1c1f26] flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-500">No report generated yet</p>
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Configure parameters and click Generate Report.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
