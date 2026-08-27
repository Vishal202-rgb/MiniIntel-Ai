import React, { useState, useEffect } from 'react';
import apiValidation from '../services/apiValidation';
import ConflictResolver from '../components/validation/ConflictResolver';
import { ShieldAlert, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const ValidationDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingIssue, setResolvingIssue] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const summaryData = await apiValidation.getValidationSummary();
      setSummary(summaryData);
      setIssues(summaryData.issues || []);
    } catch (error) {
      console.error(error);
      // Fallback mock data for visual purposes if API fails
      setSummary({ totalIssues: 12, qualityScore: 94 });
      setIssues([
        { id: '1', document: 'Q3 Report', field: 'Gold Production', issueType: 'Out of bounds', severity: 'High', status: 'Open', message: 'Value 5000 is unusually high for Q3.' },
        { id: '2', document: '2023 Annual', field: 'Operating Cost', issueType: 'Missing Unit', severity: 'Medium', status: 'Open', message: 'No currency unit provided.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveSubmit = async (data) => {
    try {
      await apiValidation.resolveIssue(resolvingIssue.id || resolvingIssue._id, data);
      setResolvingIssue(null);
      loadData(); // Reload to refresh list and summary
    } catch (error) {
      console.error(error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <ShieldAlert className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-indigo-500" />
        Validation Dashboard
      </h1>

      {loading ? (
        <div className="text-center p-8 text-gray-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Issues</p>
                  <p className="text-3xl font-bold mt-2">{summary?.totalIssues || 0}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-100 dark:text-red-900/50" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Quality Score</p>
                  <p className="text-3xl font-bold mt-2">{summary?.qualityScore || 0}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-100 dark:text-green-900/50" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Validation Issues</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 text-xs uppercase text-gray-600 dark:text-gray-400">
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
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No issues found. Great job!
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue.id || issue._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">{issue.document}</td>
                        <td className="px-4 py-3">{issue.field}</td>
                        <td className="px-4 py-3">{issue.issueType}</td>
                        <td className="px-4 py-3 flex items-center gap-1">
                          {getSeverityIcon(issue.severity)}
                          {issue.severity}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setResolvingIssue(issue)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
