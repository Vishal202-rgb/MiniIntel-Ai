import React, { useState, useEffect } from 'react';
import { getLogs } from '../services/apiAudit';
import { ScrollText, Loader2, AlertCircle } from 'lucide-react';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getLogs();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Audit Trail</h1>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">User/System</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {logs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(log.timestamp || Date.now()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                      {log.action || 'Unknown Action'}
                    </td>
                    <td className="px-6 py-4">
                      {log.user || 'System'}
                    </td>
                    <td className="px-6 py-4 max-w-md truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;
