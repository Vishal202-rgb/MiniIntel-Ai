import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, RefreshCw, Loader2, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import api from '../services/api';
import BackButton from '../components/common/BackButton';

const ReportGenerator = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [reportType, setReportType] = useState('Executive Summary');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/documents');
        // Only allow selecting completed documents
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
        responseType: 'blob' // Important for binary files like DOCX
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

  return (
    <div className="p-5 max-w-7xl mx-auto text-gray-800 dark:text-neutral-200">
      <BackButton fallback="/" />
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Report Generator</h1>
        <p className="text-gray-600 dark:text-slate-400">Generate evidence-based mining reports from your knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Source Document (Optional)</label>
              <select 
                value={selectedDoc} 
                onChange={e => setSelectedDoc(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Indexed Documents</option>
                {documents.map(d => (
                  <option key={d._id} value={d._id}>{d.filename || d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Report Type</label>
              <select 
                value={reportType} 
                onChange={e => setReportType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option>Executive Summary</option>
                <option>Production Analysis</option>
                <option>Operational Risk Report</option>
                <option>Production & Dispatch Report</option>
                <option>Comprehensive Mining Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Additional Instructions</label>
              <textarea 
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="E.g. Focus specifically on FY 2023 dispatch delays..."
                className="w-full bg-slate-50 dark:bg-dark-bg border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {generating ? 'Generating report...' : 'Generate Report'}
            </button>
            
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          {report ? (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col h-[800px]">
              <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4 bg-slate-50 dark:bg-dark-bg">
                {/* Row 1: Title and Status */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug break-words">
                    {report.title}
                  </h3>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${
                    report.status === 'draft' ? 'bg-slate-100 text-gray-600 dark:bg-dark-card dark:text-neutral-300' :
                    report.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    report.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                </div>
                
                {/* Row 2: Metrics and Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left side of Row 2: Metrics */}
                  <div className="flex flex-wrap items-center gap-3">
                    {report.status === 'draft' && (
                      <button 
                        onClick={async () => {
                          try {
                            const res = await api.put(`/reports/${report._id}/submit`);
                            setReport(res.data.data);
                          } catch (e) { alert(e.message); }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Submit for Review
                      </button>
                    )}
                    
                    {(report.confidenceScore || report.evidenceCoverage) && (
                      <div className="flex flex-wrap items-center gap-3 text-sm shrink-0 bg-white dark:bg-dark-bg/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                        <span className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">Confidence: {Math.round((report.confidenceScore || 0) * 100)}%</span>
                        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 hidden sm:block"></div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">Coverage: {report.evidenceCoverage?.percentage || 0}%</span>
                      </div>
                    )}
                  </div>

                  {/* Right side of Row 2: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => handleExport('docx')} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-neutral-100 dark:hover:bg-dark-card text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0">
                      <Download className="w-4 h-4" /> DOCX
                    </button>
                    <button onClick={() => handleExport('csv')} className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-neutral-100 dark:hover:bg-dark-card text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 shrink-0">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={downloadJson} className="px-3 py-1.5 flex items-center gap-1 border border-slate-300 dark:border-slate-600 hover:bg-neutral-100 dark:hover:bg-dark-card rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors shrink-0" title="Download JSON">
                      <Download className="w-4 h-4" /> <span className="text-sm font-medium">JSON</span>
                    </button>
                    <button onClick={copyToClipboard} className="p-2 border border-slate-300 dark:border-slate-600 hover:bg-neutral-100 dark:hover:bg-dark-card rounded-lg text-neutral-700 dark:text-neutral-300 transition-colors shrink-0" title="Copy Text">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5 overflow-y-auto grow custom-scrollbar relative">
                <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base prose-headings:text-blue-700 dark:prose-headings:text-blue-400 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                          <table className="w-full text-left border-collapse m-0" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-slate-50/80 dark:bg-dark-card text-gray-700 dark:text-neutral-300 border-b border-slate-200 dark:border-slate-700" {...props} />
                      ),
                      th: ({node, children, ...props}) => {
                        const text = String(children).toLowerCase();
                        let widthClass = "px-4 py-3 font-semibold text-sm";
                        if (text.includes('source') || text.includes('document') || text.includes('file')) widthClass += " w-[30%] min-w-[200px]";
                        else if (text.includes('page')) widthClass += " w-[12%] min-w-[80px] text-center";
                        else widthClass += " w-[58%] min-w-[300px]";
                        return <th className={widthClass} {...props}>{children}</th>;
                      },
                      td: ({node, children, ...props}) => {
                        return (
                          <td className="px-4 py-3 align-top border-b border-neutral-100 dark:border-slate-700/60 text-sm leading-relaxed" {...props}>
                            {typeof children === 'string' ? children.replace(/^["'`]|["'`]$/g, '') : children}
                          </td>
                        );
                      },
                      code: ({node, inline, children, ...props}) => (
                        <code className={`${inline ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md font-medium text-xs break-words' : 'block bg-slate-50 dark:bg-dark-card p-4 rounded-lg overflow-x-auto text-sm border border-slate-200 dark:border-slate-700'}`} {...props}>
                          {children}
                        </code>
                      )
                    }}
                  >
                    {report.content?.markdown || 'No content generated.'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 border-dashed rounded-lg h-[500px] flex items-center justify-center text-gray-500 dark:text-slate-400 flex-col gap-4">
              <FileText className="w-12 h-12 opacity-20" />
              <p>Select parameters and generate to view the report preview.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
