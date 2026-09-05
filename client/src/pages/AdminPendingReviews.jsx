import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileOutput, Eye, Check, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PendingReviews = () => {
  const [pendingReports, setPendingReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingReport, setProcessingReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const res = await api.get('/reports?status=review');
      setPendingReports(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessingReport(id);
    try {
      await api.put(`/reports/${id}/approve`);
      setSuccessMessage('Report approved successfully.');
      fetchPendingReports();
      if (selectedReport?._id === id) setSelectedReport(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve report.');
    } finally {
      setProcessingReport(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setProcessingReport(selectedReport?._id);
    try {
      await api.put(`/reports/${selectedReport._id}/reject`, { comments: rejectReason });
      setSuccessMessage('Report rejected successfully.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedReport(null);
      fetchPendingReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject report.');
    } finally {
      setProcessingReport(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Pending Reviews</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Review and approve AI-generated reports.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm font-medium">
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 dark:bg-neutral-800/40 text-gray-500 dark:text-neutral-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Submitted By</th>
                  <th className="px-6 py-4 font-semibold">Metrics</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {pendingReports.map(report => (
                  <tr key={report._id} className="hover:bg-amber-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-200 truncate max-w-[200px]" title={report.title}>{report.title}</td>
                    <td className="px-6 py-4 capitalize">{report.type}</td>
                    <td className="px-6 py-4">{report.generatedBy?.username || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Conf: {Math.round((report.confidenceScore || 0) * 100)}%</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cov: {report.evidenceCoverage?.percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(report.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="px-2 py-1 flex items-center gap-1 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" /> <span className="text-xs font-medium">View</span>
                        </button>
                        <button 
                          onClick={() => handleApprove(report._id)}
                          disabled={processingReport === report._id}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 border border-green-200 dark:border-green-800"
                          title="Approve"
                        >
                          {processingReport === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => { setSelectedReport(report); setShowRejectModal(true); }}
                          disabled={processingReport === report._id}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-800"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && pendingReports.length === 0 && (
            <div className="py-12 text-center">
              <FileOutput className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 font-medium text-base">No reports pending review.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Reject Report</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g. The evidence coverage is too low..."
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                rows="4"
              />
            </div>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingReport === selectedReport._id}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {processingReport === selectedReport._id && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {selectedReport && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-800">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-[#151515]">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">{selectedReport.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Submitted by {selectedReport.generatedBy?.username || 'Unknown'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleApprove(selectedReport._id)}
                  disabled={processingReport === selectedReport._id}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  {processingReport === selectedReport._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
                <button 
                  onClick={() => setShowRejectModal(true)}
                  disabled={processingReport === selectedReport._id}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-700 mx-1"></div>
                <button onClick={() => setSelectedReport(null)} className="p-2 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto grow custom-scrollbar">
              <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base prose-headings:text-indigo-700 dark:prose-headings:text-indigo-400 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-6 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm">
                        <table className="w-full text-left border-collapse m-0" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => (
                      <thead className="bg-gray-50/80 dark:bg-[#1A1A1A] text-gray-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800" {...props} />
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
                        <td className="px-4 py-3 align-top border-b border-neutral-100 dark:border-neutral-800/60 text-sm leading-relaxed" {...props}>
                          {typeof children === 'string' ? children.replace(/^["'`]|["'`]$/g, '') : children}
                        </td>
                      );
                    },
                    code: ({node, inline, children, ...props}) => (
                      <code className={`${inline ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-medium text-xs break-words' : 'block bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-xl overflow-x-auto text-sm border border-neutral-200 dark:border-neutral-800'}`} {...props}>
                        {children}
                      </code>
                    )
                  }}
                >
                  {selectedReport.content?.markdown || 'No content available.'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReviews;
