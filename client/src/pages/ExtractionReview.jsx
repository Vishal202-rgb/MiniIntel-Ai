import React, { useState, useEffect } from 'react';
import apiExtraction from '../services/apiExtraction';
import apiValidation from '../services/apiValidation';
import axios from 'axios';
import RecordTable from '../components/extraction/RecordTable';
import RecordEditor from '../components/extraction/RecordEditor';
import { FileText, Play, AlertCircle, CheckCircle, Loader2, Database, ChevronDown } from 'lucide-react';
import BackButton from '../components/common/BackButton';

const getDocuments = async () => {
  try {
    const res = await axios.get('/api/documents');
    return res.data;
  } catch (err) {
    return [];
  }
};

const ExtractionReview = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocument) {
      loadRecords(selectedDocument);
      setMessage(null);
    } else {
      setRecords([]);
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    const docs = await getDocuments();
    setDocuments(docs || []);
  };

  const loadRecords = async (docId) => {
    setLoading(true);
    try {
      const data = await apiExtraction.getExtractedRecords(docId);
      setRecords(data || []);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.details || error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to load records.';
      setMessage({ type: 'error', text: `Failed to load records: ${errMsg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedDocument) return;
    setExtracting(true);
    setMessage(null);
    try {
      const res = await apiExtraction.extractData(selectedDocument);
      await apiValidation.validateDocument(selectedDocument);
      await loadRecords(selectedDocument);
      
      const count = res.count !== undefined ? res.count : (res.records?.length || 0);
      setMessage({ type: 'success', text: `Extraction complete. Processed ${count} records successfully.` });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.details || error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to extract data.';
      setMessage({ type: 'error', text: `Failed to extract data: ${errMsg}` });
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await apiExtraction.updateRecord(id, data);
      setEditingRecord(null);
      loadRecords(selectedDocument);
    } catch (error) {
      console.error(error);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiExtraction.approveRecord(id);
      loadRecords(selectedDocument);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id) => {
    try {
      await apiExtraction.rejectRecord(id);
      loadRecords(selectedDocument);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkApprove = async (ids) => {
    try {
      await apiExtraction.bulkApprove(ids);
      loadRecords(selectedDocument);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-[1400px] mx-auto text-gray-800 dark:text-[#94a3b8]">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Data Extraction & Review</h1>
          <p className="text-xs text-gray-500 dark:text-slate-500">Run AI extraction and review parsed document parameters.</p>
        </div>
      </div>
      
      {/* Document Selector Control Panel */}
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-[#2d3139] p-4 rounded-lg mb-5 flex flex-col md:flex-row items-end gap-4 shadow-sm">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-semibold text-gray-500 dark:text-[#64748b] uppercase tracking-wider mb-1.5">
            Select Source Document
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-slate-50 dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-[#f1f5f9] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors pr-10"
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
            >
              <option value="">-- Choose a document from the Knowledge Base --</option>
              {documents.map(doc => (
                <option key={doc.id || doc._id} value={doc.id || doc._id}>
                  {doc.originalName || doc.filename || doc.title || doc.name || doc.id || doc._id}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>
        
        <button 
          onClick={handleExtract}
          disabled={!selectedDocument || extracting || loading}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-[#2d3139] disabled:text-gray-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-amber-500/20 disabled:shadow-none h-[38px]"
        >
          {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {extracting ? 'Extracting...' : 'Extract Data'}
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`mb-5 p-3 rounded-lg flex items-center gap-2 text-sm font-medium border
          ${message.type === 'error' 
            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40' 
            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40'}
        `}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!selectedDocument ? (
        // Empty State (No Document Selected)
        <div className="bg-white dark:bg-dark-card border border-dashed border-slate-300 dark:border-[#2d3139] rounded-lg flex items-center justify-center flex-col gap-3 text-center min-h-[400px]">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1c1f26] flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Select a document to begin extraction</p>
            <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">Extracted intelligence will appear here for review.</p>
          </div>
        </div>
      ) : loading ? (
        // Loading State
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-[#2d3139] rounded-lg flex items-center justify-center flex-col gap-3 min-h-[400px]">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Loading extracted records...</p>
        </div>
      ) : (
        // Data Table
        <RecordTable 
          records={records}
          onEdit={(record) => setEditingRecord(record)}
          onApprove={handleApprove}
          onReject={handleReject}
          onBulkApprove={handleBulkApprove}
        />
      )}

      {/* Editor Modal */}
      {editingRecord && (
        <RecordEditor 
          record={editingRecord}
          onSave={(data) => handleUpdate(editingRecord.id || editingRecord._id, data)}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
};

export default ExtractionReview;
