import React, { useState, useEffect } from 'react';
import apiValidation from '../services/apiValidation';
import ConflictResolver from '../components/validation/ConflictResolver';
import { ShieldAlert, CheckCircle, AlertTriangle, AlertCircle, Play } from 'lucide-react';
import useDocuments from '../hooks/useDocuments';
import BackButton from '../components/common/BackButton';

const ValidationDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingIssue, setResolvingIssue] = useState(null);
  
  const { documents } = useDocuments();
  const [selectedDocument, setSelectedDocument] = useState('');
  const [runningValidation, setRunningValidation] = useState(false);
  const [validationMessage, setValidationMessage] = useState(null);

  useEffect(() => {
    if (documents && documents.length > 0 && !selectedDocument) {
      setSelectedDocument(documents[0]._id);
    }
  }, [documents, selectedDocument]);

  const loadData = async (docId) => {
    if (!docId) return;
    setLoading(true);
    try {
      const summaryData = await apiValidation.getValidationSummary(docId);
      setSummary(summaryData);
      setIssues(summaryData.issues || []);
    } catch (error) {
      console.error(error);
      setSummary({ totalIssues: 0, qualityScore: 100 });
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDocument) {
      loadData(selectedDocument);
    }
  }, [selectedDocument]);

  const handleRunValidation = async () => {
    if (!selectedDocument) return;
    setRunningValidation(true);
    setValidationMessage(null);
    try {
      await apiValidation.validateDocument(selectedDocument);
      setValidationMessage({ type: 'success', text: 'Validation completed successfully.' });
      loadData(selectedDocument);
    } catch (error) {
      console.error(error);
      setValidationMessage({ type: 'error', text: 'Unable to run validation. Please try again.' });
    } finally {
      setRunningValidation(false);
    }
  };

  const handleResolveSubmit = async (data) => {
    try {
      await apiValidation.resolveIssue(resolvingIssue.id || resolvingIssue._id, data);
      setResolvingIssue(null);
      loadData(selectedDocument); // Reload to refresh list and summary
    } catch (error) {
      console.error(error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-blue-500" />;
    }
  };

  const getDocumentDisplayName = (issue) => {
    // 1. Check if populated object has originalName or title
    if (issue.documentId && typeof issue.documentId === 'object') {
      if (issue.documentId.originalName) return issue.documentId.originalName;
      if (issue.documentId.title) return issue.documentId.title;
    }
    
    // 2. Look up in the context documents array
    const docIdStr = typeof issue.documentId === 'object' ? issue.documentId._id : issue.documentId;
    if (docIdStr && documents) {
      const foundDoc = documents.find(d => d._id === docIdStr || d.id === docIdStr);
      if (foundDoc?.originalName) return foundDoc.originalName;
      if (foundDoc?.title) return foundDoc.title;
    }

    // 3. Fallback checks for 'document' or 'filename' fields
    const fallbackName = issue.document || (issue.documentId && issue.documentId.filename);
    if (fallbackName) {
      // Check if it's a raw timestamp-UUID format (e.g. 1787928884020-fa3e420c...)
      const isRawFormat = /^\d{13}-/.test(fallbackName);
      if (!isRawFormat) return fallbackName;
    }

    // 4. Default clean fallback
    return 'Mining Document';
  };

  return (
    <div className="p-5 max-w-7xl mx-auto dark:text-gray-100">
      <BackButton fallback="/" />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-blue-500" />
          Validation Dashboard
        </h1>
        
        <div className="flex items-center gap-3 bg-white dark:bg-dark-card p-2 rounded-lg shadow-sm border dark:border-slate-700">
          <select 
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 block p-2"
          >
            <option value="" disabled>Select a document</option>
            {documents?.map(doc => {
              let cleanName = doc.originalName || doc.title;
              if (!cleanName && doc.filename && !/^\d{13}-/.test(doc.filename)) {
                cleanName = doc.filename;
              }
              return (
                <option key={doc._id} value={doc._id}>{cleanName || 'Mining Document'}</option>
              );
            })}
          </select>
          <button
            onClick={handleRunValidation}
            disabled={runningValidation || !selectedDocument}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
          >
            {runningValidation ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Running validation...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" /> Run Validation
              </span>
            )}
          </button>
        </div>
      </div>

      {validationMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${validationMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'}`}>
          {validationMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{validationMessage.text}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center p-5 text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white dark:bg-dark-card p-5 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Issues</p>
                  <p className="text-3xl font-bold mt-2">{summary?.totalIssues || 0}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-100 dark:text-red-900/50" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-card p-5 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Quality Score</p>
                  <p className="text-3xl font-bold mt-2">{summary?.qualityScore || 100}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-100 dark:text-green-900/50" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-dark-bg">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Validation Issues</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
                <thead className="bg-slate-100 dark:bg-dark-card border-b dark:border-slate-700 text-xs uppercase text-gray-600 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Issue Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-5 text-center text-gray-500 dark:text-slate-400">
                        No issues found. Great job!
                      </td>
                    </tr>
                  ) : issues.map((issue) => (
                        <tr key={issue._id || issue.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-medium">
                            {getDocumentDisplayName(issue)}
                          </td>
                          <td className="px-4 py-3">{issue.field || 'N/A'}</td>
                          <td className="px-4 py-3">{issue.issueType || issue.type}</td>
                          <td className="px-4 py-3 flex items-center gap-1">
                            {getSeverityIcon(issue.severity)}
                            <span className="capitalize">{issue.severity}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${(issue.status || '').toLowerCase() === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                              <span className="capitalize">{issue.status}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {(issue.status || '').toLowerCase() !== 'resolved' ? (
                              <button
                                onClick={() => setResolvingIssue(issue)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-green-600 dark:text-green-400 font-medium text-sm">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {resolvingIssue && (
        <ConflictResolver 
          issue={resolvingIssue}
          onResolve={handleResolveSubmit}
          onCancel={() => setResolvingIssue(null)}
        />
      )}
    </div>
  );
};

export default ValidationDashboard;
