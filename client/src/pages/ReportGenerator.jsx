import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Download, Copy, RefreshCw, Loader2, Check, ChevronDown, ChevronRight, Shield, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import api from '../services/api';

const ReportGenerator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [reportType, setReportType] = useState('Executive Summary');
  const [period, setPeriod] = useState('');
  const [mineName, setMineName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [genStep, setGenStep] = useState(0); // 0: Preparing evidence, 1: Generating report, 2: Validating report
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const stepTimerRef = useRef(null);

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data?.data?.filter(d => d.status === 'completed') || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const res = await api.get('/reports');
      const list = res.data?.data || res.data || [];
      const safeList = Array.isArray(list) ? list : [];
      setRecentReports(safeList);
      return safeList;
    } catch (err) {
      console.warn('Failed to load recent reports:', err);
      return [];
    }
  };

  const loadReportById = async (id, fallbackList = []) => {
    if (!id) return;
    setLoadingReport(true);
    try {
      const res = await api.get(`/reports/${id}`);
      const loadedReport = res.data?.data || res.data;
      if (loadedReport) {
        setReport(loadedReport);
        localStorage.setItem('mineintel_active_report_id', loadedReport._id);
        setSearchParams({ id: loadedReport._id }, { replace: true });

        // Restore generation inputs from report content parameters if available
        const params = loadedReport.content?.parameters || {};
        if (params.documentId) setSelectedDoc(params.documentId);
        if (loadedReport.type) setReportType(loadedReport.type);
        if (params.period) setPeriod(params.period);
        if (params.mineName) setMineName(params.mineName);
        if (params.instructions) setInstructions(params.instructions);
      }
    } catch (err) {
      console.warn(`Could not load report ${id}:`, err.message);
      localStorage.removeItem('mineintel_active_report_id');
      // Fallback to first available report if list exists
      if (fallbackList.length > 0 && fallbackList[0]._id !== id) {
        setReport(fallbackList[0]);
      }
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      fetchDocs();
      const list = await fetchRecentReports();
      const urlId = searchParams.get('id');
      const savedId = localStorage.getItem('mineintel_active_report_id');
      const targetId = urlId || savedId || (list.length > 0 ? list[0]._id : null);
      if (targetId) {
        await loadReportById(targetId, list);
      }
    };
    init();

    return () => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  const handleNewReport = () => {
    setReport(null);
    setSelectedDoc('');
    setPeriod('');
    setMineName('');
    setInstructions('');
    setError(null);
    localStorage.removeItem('mineintel_active_report_id');
    setSearchParams({}, { replace: true });
  };

  const handleGenerate = async () => {
    if (generating) return;

    setGenerating(true);
    setGenStep(0);
    setError(null);

    const startTime = Date.now();
    stepTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 12000) {
        setGenStep(2);
      } else if (elapsed > 3500) {
        setGenStep(1);
      } else {
        setGenStep(0);
      }
    }, 1000);

    try {
      const res = await api.post('/reports/generate', {
        type: reportType,
        data: {
          documentId: selectedDoc || null,
          instructions: instructions || undefined,
          period: period || undefined,
          mineName: mineName || undefined
        }
      });
      const generatedReport = res.data?.data || res.data;
      
      // Immediate in-memory and database persistence
      setReport(generatedReport);
      localStorage.setItem('mineintel_active_report_id', generatedReport._id);
      setSearchParams({ id: generatedReport._id }, { replace: true });
      fetchRecentReports();
      setError(null);
    } catch (err) {
      console.error('Report generation error:', err);
      const errData = err.response?.data;
      setError({
        title: 'Report Generation Failed',
        reason: errData?.message || err.formattedMessage || 'The requested evidence set could not be processed.',
        suggestedAction: 'Narrow the source document, reporting period, mine, or topic and try again.',
        errorCode: errData?.errorCode || 'AI_CONTEXT_LIMIT',
        retryable: errData?.retryable !== undefined ? errData.retryable : true
      });
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
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
    a.download = `${(report.title || 'report').replace(/\s+/g, '_')}.json`;
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
      let filename = `${(report.title || 'report').replace(/\s+/g, '_')}.${format}`;
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

  const inputClass = "w-full bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-[#f1f5f9] placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "block text-[11px] font-semibold text-gray-500 dark:text-[#64748b] uppercase tracking-wider mb-1";

  const mdComponents = {
    h1: ({node, ...props}) => (
      <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-[#2d3139] leading-tight" {...props} />
    ),
    h2: ({node, ...props}) => (
      <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-[#f1f5f9] mt-3.5 mb-1.5 leading-snug" {...props} />
    ),
    h3: ({node, ...props}) => (
      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-[#e2e8f0] mt-3 mb-1" {...props} />
    ),
    h4: ({node, ...props}) => (
      <h4 className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-[#cbd5e1] mt-2.5 mb-1 uppercase tracking-wider" {...props} />
    ),
    p: ({node, ...props}) => (
      <p className="text-xs sm:text-[13px] text-gray-700 dark:text-[#94a3b8] leading-relaxed mb-2.5 break-words" {...props} />
    ),
    ul: ({node, ...props}) => (
      <ul className="list-disc pl-5 my-2 space-y-1 text-xs sm:text-[13px] text-gray-700 dark:text-[#94a3b8]" {...props} />
    ),
    ol: ({node, ...props}) => (
      <ol className="list-decimal pl-5 my-2 space-y-1 text-xs sm:text-[13px] text-gray-700 dark:text-[#94a3b8]" {...props} />
    ),
    li: ({node, ...props}) => (
      <li className="leading-relaxed break-words" {...props} />
    ),
    table: ({node, ...props}) => (
      <div className="w-full overflow-x-auto my-3 border border-slate-200 dark:border-[#2d3139] rounded-lg">
        <table className="w-full text-left border-collapse m-0 text-xs" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => (
      <thead className="bg-slate-50 dark:bg-[#1c1f26] text-gray-700 dark:text-[#94a3b8] border-b border-slate-200 dark:border-[#2d3139]" {...props} />
    ),
    th: ({node, children, ...props}) => {
      const text = String(children || '').toLowerCase();
      let widthClass = "px-3 py-2 font-semibold text-[11px] uppercase tracking-wider";
      if (text.includes('source') || text.includes('document') || text.includes('file')) widthClass += " w-[30%] min-w-[140px]";
      else if (text.includes('page')) widthClass += " w-[12%] min-w-[60px] text-center";
      else widthClass += " min-w-[180px]";
      return <th className={widthClass} {...props}>{children}</th>;
    },
    td: ({node, children, ...props}) => (
      <td className="px-3 py-2 align-top border-b border-slate-100 dark:border-[#2d3139]/60 text-xs leading-relaxed break-words" {...props}>
        {typeof children === 'string' ? children.replace(/^["'`]|["'`]$/g, '') : children}
      </td>
    ),
    code: ({node, inline, children, ...props}) => (
      <code className={`${inline ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1 py-0.5 rounded font-mono text-[11px] break-words' : 'block bg-slate-50 dark:bg-[#1c1f26] p-2.5 rounded-lg overflow-x-auto font-mono text-xs border border-slate-200 dark:border-[#2d3139]'}`} {...props}>
        {children}
      </code>
    )
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 py-3 overflow-x-hidden text-gray-800 dark:text-[#94a3b8]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-100 dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] rounded-lg">
            <FileText className="w-4 h-4 text-copper-500" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">Report Generator</h1>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">Generate verified, evidence-grounded mining intelligence reports.</p>
          </div>
        </div>

        {/* Saved / Recent Reports Selector & New Report Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {recentReports.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Saved:</span>
              <select
                value={report?._id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    loadReportById(e.target.value, recentReports);
                  }
                }}
                disabled={generating || loadingReport}
                className="bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] rounded px-2 py-1 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-amber-500 max-w-[220px] truncate"
              >
                <option value="" disabled>Select a saved report...</option>
                {recentReports.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.title || 'Untitled Report'} ({r.status || 'draft'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleNewReport}
            disabled={generating}
            className="px-2.5 py-1 bg-white dark:bg-[#1c1f26] hover:bg-slate-100 dark:hover:bg-[#2d3139] border border-slate-200 dark:border-[#2d3139] text-gray-800 dark:text-[#f1f5f9] rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Balanced 35% Left / 65% Right Layout starting from same top baseline */}
      <div className="flex flex-col lg:flex-row items-start gap-3.5 w-full">
        {/* Left Configuration Panel (35%) */}
        <div className="w-full lg:w-[35%] shrink-0">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 space-y-3 shadow-xs">
            <div>
              <label className={labelClass}>Source Document</label>
              <select 
                value={selectedDoc} 
                onChange={e => setSelectedDoc(e.target.value)}
                disabled={generating}
                className={inputClass}
              >
                <option value="">All Indexed Documents</option>
                {documents.map(d => (
                  <option key={d._id} value={d._id}>{d.originalName || d.filename || d.title}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Optional. Scopes RAG retrieval to one document.</p>
            </div>

            <div>
              <label className={labelClass}>Report Type</label>
              <select 
                value={reportType} 
                onChange={e => setReportType(e.target.value)}
                disabled={generating}
                className={inputClass}
              >
                <option>Executive Summary</option>
                <option>Production Analysis</option>
                <option>Operational Risk Report</option>
                <option>Production &amp; Dispatch Report</option>
                <option>Comprehensive Mining Report</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Period (Optional)</label>
                <input 
                  type="text"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  disabled={generating}
                  placeholder="e.g. FY 2023-24"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mine / Sub (Optional)</label>
                <input 
                  type="text"
                  value={mineName}
                  onChange={e => setMineName(e.target.value)}
                  disabled={generating}
                  placeholder="e.g. Gevra / SECL"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Instructions</label>
              <textarea 
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                disabled={generating}
                placeholder="e.g. Focus on dispatch bottlenecks, actual vs target variance, and overburden ratio..."
                className={`${inputClass} h-18 resize-none`}
              />
            </div>

            {/* Pipeline Loading State Indicator */}
            {generating && (
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    Generating Report Pipeline
                  </span>
                  <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded">
                    {genStep === 0 ? 'Step 1/3' : genStep === 1 ? 'Step 2/3' : 'Step 3/3'}
                  </span>
                </div>
                {/* Visual Pipeline Sequence */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium pt-1">
                  <div className={`p-1.5 rounded text-center transition-all ${
                    genStep === 0 
                      ? 'bg-amber-500 text-white font-bold shadow-xs' 
                      : genStep > 0 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    1. Preparing evidence
                  </div>
                  <div className={`p-1.5 rounded text-center transition-all ${
                    genStep === 1 
                      ? 'bg-amber-500 text-white font-bold shadow-xs' 
                      : genStep > 1 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    2. Generating report
                  </div>
                  <div className={`p-1.5 rounded text-center transition-all ${
                    genStep === 2 
                      ? 'bg-amber-500 text-white font-bold shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    3. Validating report
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs shadow-amber-500/20"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              {generating ? 'Processing Request...' : 'Generate Report'}
            </button>
            
            {/* Structured Error Alert Card */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-red-800 dark:text-red-200 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{error.title || 'Report Generation Failed'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">Reason: </span>
                  <span className="text-[11px] leading-relaxed">{error.reason}</span>
                </div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400 bg-red-100/50 dark:bg-red-900/20 p-2 rounded border border-red-200/60 dark:border-red-800/40 leading-relaxed">
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Suggested action: </span>
                  <span>{error.suggestedAction}</span>
                </div>
                {error.retryable && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="mt-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Generation
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Report Preview Panel (65%) */}
        <div className="w-full lg:w-[65%] grow min-w-0">
          {report ? (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col min-h-[500px] lg:h-[calc(100vh-125px)]">
              {/* Compact Header Bar */}
              <div className="border-b border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50/90 dark:bg-[#1c1f26] shrink-0">
                {/* Title & Status Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate" title={report.title}>
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

                  {report.status === 'draft' && (
                    <button 
                      onClick={async () => {
                        try {
                          const res = await api.put(`/reports/${report._id}/submit`);
                          const updated = res.data?.data || res.data;
                          setReport(updated);
                          fetchRecentReports();
                        } catch (e) { alert(e.message); }
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded transition-colors whitespace-nowrap shrink-0 shadow-xs"
                    >
                      Submit for Review
                    </button>
                  )}
                </div>

                {/* Status Detail Banners */}
                {report.status === 'approved' && (
                  <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Report Approved by Administration</span>
                      {report.approvedAt && (
                        <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 ml-2 font-mono">
                          ({new Date(report.approvedAt).toLocaleDateString()})
                        </span>
                      )}
                      {report.reviewerComments && (
                        <p className="text-[11px] mt-0.5 text-emerald-700 dark:text-emerald-300">
                          Comments: {report.reviewerComments}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {report.status === 'rejected' && (
                  <div className="mb-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Report Rejected by Reviewer</span>
                      {report.reviewerComments && (
                        <p className="text-[11px] mt-0.5 text-red-700 dark:text-red-300 font-medium">
                          Rejection Reason: {report.reviewerComments}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {report.status === 'review' && (
                  <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                    <span>Submitted for Administrative Review • Awaiting Approval</span>
                  </div>
                )}

                {/* Metrics & Export Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#2d3139]/50">
                  <div className="flex items-center gap-2">
                    {(report.confidenceScore !== undefined || report.evidenceCoverage) && (
                      <div className="flex items-center gap-2 text-[11px] bg-white dark:bg-[#13151b] border border-slate-200 dark:border-[#2d3139] px-2 py-0.5 rounded shadow-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold whitespace-nowrap">
                          Confidence {Math.round((report.confidenceScore || 0) * 100)}%
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          Coverage {report.evidenceCoverage?.percentage || 0}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compact Export Buttons */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleExport('docx')} className="px-2 py-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff0a] text-gray-700 dark:text-slate-300 text-[11px] font-medium rounded transition-colors flex items-center gap-1" title="Export DOCX">
                      <Download className="w-3 h-3 text-slate-400" /> DOCX
                    </button>
                    <button onClick={() => handleExport('csv')} className="px-2 py-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff0a] text-gray-700 dark:text-slate-300 text-[11px] font-medium rounded transition-colors flex items-center gap-1" title="Export CSV">
                      <Download className="w-3 h-3 text-slate-400" /> CSV
                    </button>
                    <button onClick={downloadJson} className="px-2 py-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff0a] text-gray-700 dark:text-slate-300 text-[11px] font-medium rounded transition-colors flex items-center gap-1" title="Export JSON">
                      <Download className="w-3 h-3 text-slate-400" /> JSON
                    </button>
                    <button onClick={copyToClipboard} className="p-1 border border-slate-200 dark:border-[#2d3139] hover:bg-slate-100 dark:hover:bg-[#ffffff0a] rounded text-gray-700 dark:text-slate-300 transition-colors" title="Copy Markdown">
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-3.5 sm:p-4 overflow-y-auto grow custom-scrollbar break-words">
                {report?.content?.markdown && (
                  report.content.markdown.includes('reached the maximum API limits') ||
                  report.content.markdown.includes('The task is very complex and reached the maximum')
                ) && (
                  <div className="mb-3.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-lg flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Legacy Incomplete Report</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed">
                        This previously generated report encountered an API limit. Generate a new report using the updated evidence-first engine above.
                      </p>
                    </div>
                  </div>
                )}

                {/* Report Markdown Content */}
                <div className="prose dark:prose-invert max-w-none prose-sm prose-headings:text-gray-900 dark:prose-headings:text-[#f1f5f9] prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-code:before:content-none prose-code:after:content-none prose-strong:text-gray-900 dark:prose-strong:text-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={mdComponents}
                  >
                    {markdownParts.main || 'No content generated.'}
                  </ReactMarkdown>
                </div>
                
                {/* Evidence Appendix Accordion */}
                {markdownParts.evidence && (
                  <div className="mt-5 border-t border-slate-200 dark:border-[#2d3139] pt-3.5">
                    <button
                      onClick={() => setEvidenceOpen(!evidenceOpen)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-[#94a3b8] hover:text-gray-900 dark:hover:text-white transition-colors mb-2.5"
                    >
                      {evidenceOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      Evidence Appendix &amp; Citations
                    </button>
                    {evidenceOpen && (
                      <div className="w-full max-w-full overflow-hidden break-words text-xs prose dark:prose-invert max-w-none prose-sm">
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
            /* Empty State Container */
            <div className="bg-white dark:bg-dark-card border border-dashed border-slate-200 dark:border-slate-700/80 rounded-lg flex items-center justify-center flex-col gap-2.5 text-center min-h-[420px] lg:h-[calc(100vh-125px)] p-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="max-w-sm">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">No report generated yet</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Configure source document, reporting period, and instructions on the left, then click Generate Report.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;

