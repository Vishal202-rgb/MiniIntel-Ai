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
    <div className="p-6 max-w-7xl mx-auto text-neutral-200">
      <div className="flex items-center gap-3 mb-8">
        <ScrollText className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Audit Trail</h1>
          <p className="text-neutral-400">Track and monitor all system and user activities.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A1A1A] border border-neutral-800 p-5 rounded-xl">
          <h3 className="text-sm font-medium text-neutral-400 mb-1">Total Events</h3>
          <p className="text-3xl font-bold text-white">{loading ? '-' : stats.totalEvents}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-neutral-800 p-5 rounded-xl">
          <h3 className="text-sm font-medium text-neutral-400 mb-1">Successful</h3>
          <p className="text-3xl font-bold text-green-400">{loading ? '-' : stats.successful}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-neutral-800 p-5 rounded-xl">
          <h3 className="text-sm font-medium text-neutral-400 mb-1">Failed</h3>
          <p className="text-3xl font-bold text-red-400">{loading ? '-' : stats.failed}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-neutral-800 p-5 rounded-xl">
          <h3 className="text-sm font-medium text-neutral-400 mb-1">Active Users</h3>
          <p className="text-3xl font-bold text-indigo-400">{loading ? '-' : stats.activeUsers}</p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-neutral-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
            <p>Loading audit logs...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-[#222] text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Resource</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#222] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {log.user ? log.user.username : 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-800 text-neutral-200 rounded-md text-xs font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
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
                    <td className="px-6 py-4 max-w-xs truncate text-neutral-500" title={JSON.stringify(log.details)}>
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
