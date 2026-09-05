import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { FileText, TrendingUp, Truck, CheckCircle, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Assuming authorization interceptors are setup globally in api.js, 
      // but to be safe and use raw axios if interceptors aren't covering this component:
      const userInfo = localStorage.getItem('userInfo');
      const token = userInfo ? JSON.parse(userInfo).token : '';
      
      const response = await axios.get('/api/analytics/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-500">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-5 flex flex-col items-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Analytics</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, productionData, insights } = data;

  const kpiCards = [
    { label: 'Total Documents', value: kpis.totalDocuments, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Production', value: kpis.totalProduction, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Dispatch', value: kpis.totalDispatch, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Avg Validation Score', value: kpis.averageValidationScore, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Open Issues', value: kpis.openIssues, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  // Custom Tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-600 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-neutral-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value} {entry.name.includes('Gap') || entry.name === 'Production' || entry.name === 'Dispatch' || entry.name === 'Target' ? 'MT' : '%'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-5 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Production metrics, dispatch tracking, and AI insights.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {kpiCards.map((stat, idx) => (
          <div key={idx} className="hover-lift bg-white dark:bg-dark-card p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-colors">
            <div className={`p-3 rounded-lg shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-slate-400 truncate">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Production vs Dispatch */}
        <div className="bg-white dark:bg-dark-card p-5 md:p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Production vs Dispatch (MT)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="year" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="production" name="Production" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dispatch" name="Dispatch" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Target Achievement */}
        <div className="bg-white dark:bg-dark-card p-5 md:p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Target Achievement</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={productionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="year" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="production" name="Actual Production" fill="#8b5cf6" barSize={40} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production-Dispatch Gap */}
        <div className="bg-white dark:bg-dark-card p-5 md:p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover-lift lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Production-Dispatch Gap Analysis</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Gap (MT)
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={productionData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="year" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="gap" name="Gap" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-dark-card p-5 md:p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover-lift">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          AI-Generated Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-4 bg-neutral-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-blue-500/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 font-semibold text-sm">
                0{idx + 1}
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {insight}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsDashboard;
