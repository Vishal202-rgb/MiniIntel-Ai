import React, { useState, useEffect } from 'react';
import { ScrollText, Loader2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, successful: 0, failed: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          api.get('/audit'),
          api.get('/audit/stats')
        ]);
        setLogs(logsRes.data.data || []);
        setStats(statsRes.data.data || { totalEvents: 0, successful: 0, failed: 0, activeUsers: 0 });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-5 max-w-7xl mx-auto text-gray-800 dark:text-neutral-200">
      <div className="flex items-center gap-3 mb-5">
        <ScrollText className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Audit Trail</h1>
          <p className="text-gray-600 dark:text-slate-400">Track and monitor all system and user activities.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Total Events</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loading ? '-' : stats.totalEvents}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Successful</h3>
          <p className="text-3xl font-bold text-green-400">{loading ? '-' : stats.successful}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Failed</h3>
          <p className="text-3xl font-bold text-red-400">{loading ? '-' : stats.failed}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-1">Active Users</h3>
          <p className="text-3xl font-bold text-blue-400">{loading ? '-' : stats.activeUsers}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-400" />
            <p>Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-5 bg-red-950/30 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-slate-400">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-neutral-300">
              <thead className="bg-slate-100 dark:bg-dark-bg text-gray-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Resource</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-100 dark:hover:bg-[#222] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {log.user ? log.user.username : 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-dark-card text-gray-800 dark:text-neutral-200 rounded-md text-xs font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                      {log.resource || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {log.status === 'SUCCESS' ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><CheckCircle className="w-4 h-4"/> Success</span>
                      ) : log.status === 'FAILED' ? (
                        <span className="flex items-center gap-1 text-red-400 text-xs font-medium"><XCircle className="w-4 h-4"/> Failed</span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium"><Clock className="w-4 h-4"/> Processing</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-500 dark:text-slate-400" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : '-'}
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
