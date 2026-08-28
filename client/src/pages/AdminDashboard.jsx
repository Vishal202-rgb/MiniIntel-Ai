import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, FileText, ShieldAlert, Activity, Database, Server, Clock, 
  AlertCircle, FileOutput, Search, RefreshCw, CheckCircle, XCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, colorClass, loading }) => (
  <div className="bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h3 className="text-gray-500 dark:text-neutral-400 text-xs font-medium uppercase tracking-wider">{label}</h3>
    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
      {loading ? <span className="inline-block w-8 h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" /> : value}
    </p>
  </div>
);

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => (
  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
    role === 'admin' 
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }`}>
    {role}
  </span>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-neutral-700/50 dark:text-neutral-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${colors[status] || colors.inactive}`}>
      {status || 'N/A'}
    </span>
  );
};

// ─── Health Indicator ─────────────────────────────────────────────────────────
const HealthDot = ({ status }) => {
  const isHealthy = status === 'Connected' || status === 'Online';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
      <span className={`text-sm font-medium ${isHealthy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {status}
      </span>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, iconColor, children }) => (
  <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
    <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      {title}
    </h2>
    {children}
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User management state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userSort, setUserSort] = useState({ key: 'createdAt', dir: 'desc' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/users'),
        axios.get('/api/documents'),
        axios.get('/api/audit?limit=15'),
        axios.get('/api/admin/system-health')
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data?.data);
      if (results[1].status === 'fulfilled') setUsers(results[1].value.data?.data || []);
      if (results[2].status === 'fulfilled') setDocuments(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setAuditLogs(results[3].value.data?.data || []);
      if (results[4].status === 'fulfilled') setSystemHealth(results[4].value.data?.data);

      // Check if critical endpoints failed
      const criticalFailed = results[0].status === 'rejected' && results[1].status === 'rejected';
      if (criticalFailed) {
        setError('Failed to load admin data. Please check your admin authorization.');
      }
    } catch (err) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered & sorted users ──
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      result = result.filter(u => 
        u.username?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    result.sort((a, b) => {
      const valA = a[userSort.key] || '';
      const valB = b[userSort.key] || '';
      const cmp = typeof valA === 'string' ? valA.localeCompare(valB) : new Date(valA) - new Date(valB);
      return userSort.dir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [users, userSearch, roleFilter, userSort]);

  const toggleSort = (key) => {
    setUserSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ column }) => {
    if (userSort.key !== column) return null;
    return userSort.dir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Server className="w-12 h-12 animate-pulse text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-neutral-400 text-lg">Loading Admin Dashboard...</p>
          <p className="text-gray-400 dark:text-neutral-500 text-sm mt-1">Fetching data from MongoDB</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-neutral-400 text-sm mt-0.5">System overview, user management, and health monitoring.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ── Overview Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users}       label="Users"         value={stats?.totalUsers ?? users.length}    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" loading={!stats} />
        <StatCard icon={Database}    label="Documents"     value={stats?.totalDocuments ?? 0}           colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" loading={!stats} />
        <StatCard icon={CheckCircle} label="Indexed"       value={stats?.indexedDocuments ?? 0}         colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" loading={!stats} />
        <StatCard icon={FileOutput}  label="Reports"       value={stats?.reportsGenerated ?? 0}         colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" loading={!stats} />
        <StatCard icon={ShieldAlert} label="Validations"   value={stats?.totalValidations ?? 0}         colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" loading={!stats} />
        <StatCard icon={AlertCircle} label="Open Issues"   value={stats?.openValidations ?? 0}          colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" loading={!stats} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* USER MANAGEMENT (full-width)                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <SectionHeader icon={Users} title={`User Management (${users.length})`} iconColor="text-blue-500">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow w-48"
              />
            </div>
            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </SectionHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-neutral-400 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 font-medium cursor-pointer select-none hover:text-neutral-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('username')}>
                  Username <SortIcon column="username" />
                </th>
                <th className="px-5 py-3 font-medium cursor-pointer select-none hover:text-neutral-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('email')}>
                  Email <SortIcon column="email" />
                </th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium cursor-pointer select-none hover:text-neutral-900 dark:hover:text-white transition-colors" onClick={() => toggleSort('createdAt')}>
                  Created <SortIcon column="createdAt" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-200">{u.username}</td>
                  <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">{u.email || '—'}</td>
                  <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={u.status || 'active'} /></td>
                  <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              {userSearch || roleFilter !== 'all' ? 'No users match your filters.' : 'No users registered yet.'}
            </p>
            <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Users will appear here automatically when they register.</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Lower Grid: Documents | System Health + Activity                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Document Management (2 cols) ── */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <SectionHeader icon={FileText} title={`Documents (${documents.length})`} iconColor="text-purple-500" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-neutral-400 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 font-medium">Filename</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {documents.slice(0, 8).map(doc => (
                  <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-200 truncate max-w-[250px]">{doc.originalName || doc.filename}</td>
                    <td className="px-5 py-3 uppercase text-xs text-neutral-500 dark:text-neutral-400">{doc.fileType || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {documents.length === 0 && (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">No documents uploaded yet.</p>
            </div>
          )}
        </div>

        {/* ── Right Column: Health + Activity ── */}
        <div className="space-y-6">

          {/* System Health */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <SectionHeader icon={Activity} title="System Health" iconColor="text-green-500" />
            <div className="p-5 space-y-4">
              {systemHealth ? Object.entries(systemHealth).map(([service, status]) => (
                <div key={service} className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">{service}</span>
                  <HealthDot status={status} />
                </div>
              )) : (
                <p className="text-sm text-neutral-500 text-center py-2">Health data unavailable.</p>
              )}
            </div>
          </div>

          {/* Recent Activity / Audit */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <SectionHeader icon={Clock} title="Recent Activity" iconColor="text-indigo-500" />
            <div className="p-4 space-y-3">
              {auditLogs.slice(0, 6).map((log, i) => (
                <div key={log._id || i} className="flex gap-3 items-start">
                  <div className="mt-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200 truncate">{log.action}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{formatDate(log.timestamp || log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="text-center text-sm text-neutral-500 py-4">No recent activity recorded.</div>
              )}
            </div>
            {auditLogs.length > 0 && (
              <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 text-center bg-gray-50/50 dark:bg-white/[0.01]">
                <Link to="/audit" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View Full Audit Trail →</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
