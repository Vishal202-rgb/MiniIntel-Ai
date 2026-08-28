import React, { useState, useEffect } from 'react';
import apiExtraction from '../services/apiExtraction';
import apiValidation from '../services/apiValidation';
import axios from 'axios';
import RecordTable from '../components/extraction/RecordTable';
import RecordEditor from '../components/extraction/RecordEditor';
import { FileText, Play, AlertCircle, CheckCircle } from 'lucide-react';

// Fallback to fetch documents
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
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiExtraction.extractData(selectedDocument);
      // Automatically trigger validation after extraction
      await apiValidation.validateDocument(selectedDocument);
      await loadRecords(selectedDocument);
      
      const count = res.count !== undefined ? res.count : (res.records?.length || 0);
      setMessage({ type: 'success', text: `Data extracted successfully. Found ${count} records.` });
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.details || error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to extract data.';
      setMessage({ type: 'error', text: `Failed to extract data: ${errMsg}` });
    } finally {
      setLoading(false);
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
    <div className="p-6 max-w-7xl mx-auto dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-blue-500" />
        Data Extraction & Review
      </h1>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Select Document</label>
          <select 
            className="w-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
          >
            <option value="">-- Select a Document --</option>
            {documents.map(doc => (
              <option key={doc.id || doc._id} value={doc.id || doc._id}>
                {doc.originalName || doc.filename || doc.title || doc.name || doc.id || doc._id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end h-full mt-6">
          <button 
            onClick={handleExtract}
            disabled={!selectedDocument || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Extracting...' : 'Extract Data'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded flex items-center gap-2 ${message.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading records...</div>
        ) : (
          <RecordTable 
            records={records}
            onEdit={(record) => setEditingRecord(record)}
            onApprove={handleApprove}
            onReject={handleReject}
            onBulkApprove={handleBulkApprove}
          />
        )}
      </div>

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
