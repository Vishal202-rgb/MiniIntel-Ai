import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, RefreshCw, Loader2, Check } from 'lucide-react';
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

  return (
    <div className="p-6 max-w-7xl mx-auto text-neutral-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Report Generator</h1>
        <p className="text-neutral-400">Generate evidence-based mining reports from your knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1A1A1A] border border-neutral-800 p-6 rounded-xl space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Source Document (Optional)</label>
              <select 
                value={selectedDoc} 
                onChange={e => setSelectedDoc(e.target.value)}
                className="w-full bg-[#111] border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Indexed Documents</option>
                {documents.map(d => (
                  <option key={d._id} value={d._id}>{d.filename || d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Report Type</label>
              <select 
                value={reportType} 
                onChange={e => setReportType(e.target.value)}
                className="w-full bg-[#111] border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option>Executive Summary</option>
                <option>Production Analysis</option>
                <option>Operational Risk Report</option>
                <option>Production & Dispatch Report</option>
                <option>Comprehensive Mining Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Additional Instructions</label>
              <textarea 
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="E.g. Focus specifically on FY 2023 dispatch delays..."
                className="w-full bg-[#111] border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[800px]">
              <div className="border-b border-neutral-800 p-4 flex items-center justify-between bg-[#151515]">
                <h3 className="font-bold text-white truncate pr-4">{report.title}</h3>
                <div className="flex gap-2 shrink-0">
                  <button onClick={copyToClipboard} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Copy">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={downloadJson} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Download JSON">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={handleGenerate} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Regenerate">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto grow custom-scrollbar">
                <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base prose-headings:text-indigo-400 prose-a:text-indigo-400">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-4 border border-neutral-800 rounded-lg">
                          <table className="min-w-full divide-y divide-neutral-800 m-0" {...props} />
                        </div>
                      )
                    }}
                  >
                    {report.content?.markdown || 'No content generated.'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-neutral-800 border-dashed rounded-xl h-[500px] flex items-center justify-center text-neutral-500 flex-col gap-4">
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
