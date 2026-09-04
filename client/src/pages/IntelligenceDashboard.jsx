import React, { useState, useEffect } from 'react';
import { Sparkles, Users2, FileSearch, GitCompareArrows, TrendingUp, Loader2, AlertTriangle, Link2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';

const tabs = [
  { id: 'entities', label: 'Entity Explorer', icon: Users2 },
  { id: 'similarity', label: 'Document Similarity', icon: FileSearch },
  { id: 'changes', label: 'Change Detection', icon: GitCompareArrows },
  { id: 'trends', label: 'Topic Trends', icon: TrendingUp },
];

const IntelligenceDashboard = () => {
  const [activeTab, setActiveTab] = useState('entities');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/documents').then(res => setDocuments(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
          <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Intelligence</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Advanced document analysis & insights</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 rounded-xl p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
        {activeTab === 'entities' && <EntityExplorer documents={documents} />}
        {activeTab === 'similarity' && <DocumentSimilarity documents={documents} />}
        {activeTab === 'changes' && <ChangeDetection documents={documents} />}
        {activeTab === 'trends' && <TopicTrends />}
      </div>
    </div>
  );
};

// ==========================================
// TAB 1: ENTITY EXPLORER
// ==========================================
const EntityExplorer = ({ documents }) => {
  const [selectedDoc, setSelectedDoc] = useState('');
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [docName, setDocName] = useState('');

  const loadEntities = async (docId) => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await api.get(`/intelligence/entities/${docId}`);
      setEntities(res.data.entities || []);
      setDocName(res.data.documentName || '');
    } catch (err) {
      setEntities([]);
    }
    setLoading(false);
  };

  const typeColors = {
    Mine: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    Subsidiary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Location: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Equipment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    Project: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    Person: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    Organization: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    Other: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={selectedDoc}
          onChange={e => { setSelectedDoc(e.target.value); loadEntities(e.target.value); }}
          className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
        >
          <option value="">Select a document...</option>
          {documents.filter(d => d.status === 'completed' || d.status === 'extracted').map(d => (
            <option key={d._id} value={d._id}>{d.originalName}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-2 text-neutral-500">Extracting entities...</span>
        </div>
      )}

      {!loading && entities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            {entities.length} entities found in {docName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entities.map((entity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[entity.type] || typeColors.Other}`}>
                    {entity.type}
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white text-sm">{entity.name}</span>
                </div>
                <span className="text-xs text-neutral-400">{entity.mentions}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && selectedDoc && entities.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No entities found. The document may not contain named entities.</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// TAB 2: DOCUMENT SIMILARITY
// ==========================================
const DocumentSimilarity = ({ documents }) => {
  const [selectedDoc, setSelectedDoc] = useState('');
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSimilarity = async (docId) => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await api.get(`/intelligence/similarity/${docId}`);
      setSimilar(res.data.similar || []);
    } catch {
      setSimilar([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <select
        value={selectedDoc}
        onChange={e => { setSelectedDoc(e.target.value); loadSimilarity(e.target.value); }}
        className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
      >
        <option value="">Select a document to find similar ones...</option>
        {documents.filter(d => d.status === 'completed' || d.status === 'extracted').map(d => (
          <option key={d._id} value={d._id}>{d.originalName}</option>
        ))}
      </select>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-2 text-neutral-500">Computing similarity...</span>
        </div>
      )}

      {!loading && similar.length > 0 && (
        <div className="space-y-3">
          {similar.map((s, i) => {
            const name = s.doc?.originalName || s.documentId?.originalName || 'Document';
            const scorePercent = Math.round((s.score || 0) * 100);
            return (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{s.doc?.fileType?.toUpperCase() || ''} • {s.doc?.category || ''}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{scorePercent}%</div>
                  <div className="text-xs text-neutral-400">similarity</div>
                </div>
                <div className="w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${scorePercent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && selectedDoc && similar.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          <FileSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No similar documents found. Upload more documents to enable similarity analysis.</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// TAB 3: CHANGE DETECTION
// ==========================================
const ChangeDetection = ({ documents }) => {
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!docA || !docB) return;
    setLoading(true);
    try {
      const res = await api.get(`/intelligence/changes?docA=${docA}&docB=${docB}`);
      setResult(res.data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  };

  const changeColors = {
    added: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    changed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const extractedDocs = documents.filter(d => d.status === 'extracted');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          value={docA}
          onChange={e => setDocA(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
        >
          <option value="">Document A...</option>
          {extractedDocs.map(d => (
            <option key={d._id} value={d._id}>{d.originalName}</option>
          ))}
        </select>
        <select
          value={docB}
          onChange={e => setDocB(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
        >
          <option value="">Document B...</option>
          {extractedDocs.map(d => (
            <option key={d._id} value={d._id}>{d.originalName}</option>
          ))}
        </select>
      </div>
      <button
        onClick={compare}
        disabled={!docA || !docB || docA === docB || loading}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
        Compare Documents
      </button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{result.added}</div>
              <div className="text-xs text-green-600 dark:text-green-500 uppercase font-medium">Added</div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{result.removed}</div>
              <div className="text-xs text-red-600 dark:text-red-500 uppercase font-medium">Removed</div>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{result.modified}</div>
              <div className="text-xs text-amber-600 dark:text-amber-500 uppercase font-medium">Modified</div>
            </div>
          </div>

          {result.changes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-left text-xs uppercase text-neutral-500 dark:text-neutral-400">
                    <th className="px-4 py-3">Change</th>
                    <th className="px-4 py-3">Parameter</th>
                    <th className="px-4 py-3">Mine</th>
                    <th className="px-4 py-3">{result.documentA?.name || 'Doc A'}</th>
                    <th className="px-4 py-3">{result.documentB?.name || 'Doc B'}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.changes.slice(0, 50).map((c, i) => (
                    <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${changeColors[c.type]}`}>{c.type}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{c.parameter}</td>
                      <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{c.mineName || '—'}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{c.oldValue || '—'}</td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{c.newValue || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// TAB 4: TOPIC TRENDS
// ==========================================
const TopicTrends = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/intelligence/topics/trends')
      .then(res => setTrends(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Transform data for Recharts
  const chartData = (() => {
    const periods = new Set();
    trends.forEach(t => t.trends?.forEach(td => periods.add(td.period)));
    const sortedPeriods = [...periods].sort();

    return sortedPeriods.map(period => {
      const row = { period };
      trends.forEach(t => {
        const match = t.trends?.find(td => td.period === period);
        row[t.name] = match ? match.count : 0;
      });
      return row;
    });
  })();

  const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-neutral-500">Loading topic trends...</span>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No topic trend data available yet. Process more documents to see trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="period" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
            <Legend />
            {trends.map((t, i) => (
              <Bar key={t.name} dataKey={t.name} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {trends.map((t, i) => (
          <div key={t.name} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="font-medium text-sm text-neutral-900 dark:text-white truncate">{t.name}</span>
            </div>
            <p className="text-xs text-neutral-400">{t.trends?.length || 0} periods tracked</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
