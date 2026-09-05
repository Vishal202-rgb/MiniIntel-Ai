import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Brain, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/admin/system-health');
        setHealth(res.data.data);
      } catch (err) {
        setHealth({
          backend: 'Offline',
          mongoDB: 'Unknown',
          aiProvider: 'Unknown',
          vectorDB: 'Unknown'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  const StatusIcon = ({ status }) => {
    if (status === 'Online' || status === 'Connected') return <CheckCircle className="w-6 h-6 text-green-400" />;
    return <XCircle className="w-6 h-6 text-red-400" />;
  };

  return (
    <div className="p-5 max-w-6xl mx-auto text-gray-800 dark:text-neutral-200">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">System Health</h1>
          <p className="text-gray-600 dark:text-slate-400">Monitor critical system dependencies and infrastructure.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hover-lift bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-dark-card rounded-lg"><Server className="w-6 h-6 text-gray-700 dark:text-neutral-300" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Backend Server</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Express API Layer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-medium">
            {loading ? '...' : health?.backend} {loading ? null : <StatusIcon status={health?.backend} />}
          </div>
        </div>

        <div className="hover-lift bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-dark-card rounded-lg"><Database className="w-6 h-6 text-gray-700 dark:text-neutral-300" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">MongoDB</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Primary Datastore</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-medium">
            {loading ? '...' : health?.mongoDB} {loading ? null : <StatusIcon status={health?.mongoDB} />}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-dark-card rounded-lg"><Brain className="w-6 h-6 text-gray-700 dark:text-neutral-300" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Provider (Gemini)</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">LLM & Embeddings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-medium">
            {loading ? '...' : health?.aiProvider} {loading ? null : <StatusIcon status={health?.aiProvider} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
