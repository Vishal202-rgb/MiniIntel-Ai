import React, { useState } from 'react';
import { 
  FileText, Brain, Activity, Clock, FileUp, 
  CheckCircle, AlertTriangle, TrendingUp, XCircle, ChevronRight,
  Upload, Database, MessageSquare, ArrowRight
} from 'lucide-react';
import useDocuments from '../hooks/useDocuments';
import { uploadDocument, getDocumentById, deleteDocument, retryDocument } from '../services/api';
import DropZone from '../components/upload/DropZone';
import UploadProgress from '../components/upload/UploadProgress';
import DocumentFilters from '../components/documents/DocumentFilters';
import DocumentList from '../components/documents/DocumentList';
import DocumentPreview from '../components/documents/DocumentPreview';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, trendUp, colorClass }) => (
  <div className="hover-lift bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-gray-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</h3>
    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{value}</p>
  </div>
);

const Dashboard = () => {
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const { documents, loading, fetchDocuments } = useDocuments(filters);
  const [uploads, setUploads] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Derived KPI Calculations
  const totalDocs = documents?.length || 0;
  const processedDocs = documents?.filter(d => ['completed', 'extracted'].includes(d.status)).length || 0;
  const pendingDocs = documents?.filter(d => ['pending', 'processing'].includes(d.status)).length || 0;
  const failedDocs = documents?.filter(d => d.status === 'failed').length || 0;

  const handleUpload = async (file) => {
    const uploadId = Date.now().toString();
    setUploads((prev) => [
      ...prev,
      { id: uploadId, name: file.name, progress: 0, status: 'uploading' }
    ]);

    try {
      await uploadDocument(file, (progress) => {
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress } : u))
        );
      });
      
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'success', progress: 100 } : u))
      );
      fetchDocuments(filters);
      
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 3000);
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? { ...u, status: 'error', error: error.response?.data?.message || 'Upload failed' }
            : u
        )
      );
    }
  };

  const handleDismissUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handlePreview = async (id) => {
    try {
      const response = await getDocumentById(id);
      setPreviewDoc(response.data);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Failed to preview document', error);
      alert('Failed to load document preview');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      fetchDocuments(filters);
    } catch (error) {
      console.error('Failed to delete document', error);
      alert('Failed to delete document');
    }
  };

  const handleRetry = async (id) => {
    try {
      await retryDocument(id);
      setPreviewOpen(false);
      fetchDocuments(filters);
    } catch (error) {
      console.error('Failed to retry document', error);
      alert('Failed to retry processing');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            My Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Real-time metrics and document processing status.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={FileText} label="Total Documents" value={totalDocs} 
          trend="+12% this week" trendUp={true} colorClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" 
        />
        <StatCard 
          icon={CheckCircle} label="Processed" value={processedDocs} 
          trend="98% success rate" trendUp={true} colorClass="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
        />
        <StatCard 
          icon={Clock} label="Pending / Processing" value={pendingDocs} 
          colorClass="bg-amber-50 text-copper-600 dark:bg-amber-900/20 dark:text-copper-400" 
        />
        <StatCard 
          icon={XCircle} label="Failed Extractions" value={failedDocs} 
          trend="Needs review" trendUp={false} colorClass="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" 
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/extraction" className="hover-lift flex items-center p-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-card/50 transition-colors group">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg mr-4">
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Upload & Extract</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Process new mining documents</p>
              </div>
              <ArrowRight className="hover-lift-arrow w-5 h-5 ml-auto text-gray-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
            </Link>

            <Link to="/knowledge-base" className="hover-lift flex items-center p-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-card/50 transition-colors group">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg mr-4">
                <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Knowledge Base</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Search indexed records</p>
              </div>
              <ArrowRight className="hover-lift-arrow w-5 h-5 ml-auto text-gray-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
            </Link>

            <Link to="/ai-assistant" className="hover-lift flex items-center p-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-card/50 transition-colors group">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg mr-4">
                <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">AI Assistant</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Ask questions about data</p>
              </div>
              <ArrowRight className="hover-lift-arrow w-5 h-5 ml-auto text-gray-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
            </Link>
          </div>

          {/* Upload Section */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-amber-600 dark:text-amber-500" /> Upload & Analyze
              </h2>
            </div>
            <DropZone onUpload={handleUpload} />
            <div className="mt-2">
              <UploadProgress uploads={uploads} onDismiss={handleDismissUpload} />
            </div>
          </div>

          {/* Document Management */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Recent Documents</h2>
              <Link to="/command-center" className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1">
                Command Center <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <DocumentFilters
              search={filters.search}
              type={filters.type}
              status={filters.status}
              onSearchChange={(val) => setFilters(prev => ({ ...prev, search: val }))}
              onTypeChange={(val) => setFilters(prev => ({ ...prev, type: val }))}
              onStatusChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
            />
            
            <div className="mt-4">
              <DocumentList
                documents={documents}
                loading={loading}
                onPreview={handlePreview}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>

        {/* Right Column (Side Panels) */}
        <div className="lg:col-span-3 space-y-4">
          {/* AI Insights Panel */}
          <div className="bg-white dark:bg-[#161B26] rounded-lg p-5 shadow-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#2B3245]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-copper-500" />
                <h2 className="text-sm font-bold tracking-tight">Operational Insights</h2>
              </div>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-copper-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-copper-500"></span>
              </span>
            </div>
            
            <div className="space-y-2.5">
              <div className="bg-slate-50 dark:bg-[#0B0E14] rounded-lg p-3 border border-slate-200 dark:border-[#2B3245]">
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-copper-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Production Anomaly</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Coal extraction at Mine Alpha is 15% below quarterly target based on recent reports.</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#0B0E14] rounded-lg p-3 border border-slate-200 dark:border-[#2B3245]">
                <div className="flex gap-2.5 items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Validation Clean</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Last 5 documents parsed with 100% data integrity. No manual review needed.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#2B3245]">
              <Link to="/ai-assistant" className="text-xs text-copper-600 dark:text-copper-400 hover:underline font-semibold flex items-center justify-center gap-1.5 transition-colors">
                Open AI Operations Assistant <TrendingUp className="w-3.5 h-3.5 rotate-45" />
              </Link>
            </div>
          </div>

          {/* Processing Activity */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500 dark:text-slate-400" /> Activity Feed
            </h2>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[9px] before:-translate-x-px before:h-full before:w-[2px] before:bg-neutral-100 dark:before:bg-dark-card">
              {documents?.slice(0, 5).map((doc, idx) => (
                <div key={idx} className="relative flex items-start gap-3">
                  <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-[3px] border-white dark:border-dark-card bg-amber-500 shrink-0 z-10 mt-0.5"></div>
                  <div className="flex-1 bg-neutral-50 dark:bg-dark-card p-3 rounded-lg border border-neutral-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[13px] text-neutral-900 dark:text-white truncate max-w-[150px]" title={doc.originalName}>{doc.originalName}</span>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{new Date(doc.uploadedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                      {['completed', 'extracted'].includes(doc.status) ? 'Document processed & successfully indexed into Knowledge Base.' : doc.status === 'failed' ? 'Failed to process document.' : 'Processing initiated...'}
                    </p>
                  </div>
                </div>
              ))}
              {(!documents || documents.length === 0) && (
                <div className="text-[13px] text-gray-500 dark:text-slate-400 text-center py-4 relative z-10">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <DocumentPreview
        document={previewDoc}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default Dashboard;
