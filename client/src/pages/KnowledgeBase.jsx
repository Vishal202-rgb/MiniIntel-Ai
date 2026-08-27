import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { indexDocument, searchKnowledgeBase } from '../services/apiRag';
import axios from 'axios';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [indexingStatus, setIndexingStatus] = useState(null); // 'loading', 'success', 'error'
  const [indexMessage, setIndexMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Assuming GET /api/documents exists or using fallback
      const res = await axios.get('/api/documents').catch(() => ({ data: [{ _id: '1', title: 'Example Document.pdf' }] }));
      setDocuments(res.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleIndex = async () => {
    if (!selectedDocId) return;
    setIndexingStatus('loading');
    try {
      await indexDocument(selectedDocId);
      setIndexingStatus('success');
      setIndexMessage('Document indexed successfully for AI.');
    } catch (error) {
      setIndexingStatus('error');
      setIndexMessage('Failed to index document.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    try {
      const data = await searchKnowledgeBase(searchQuery);
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Database className="text-blue-600" />
        Knowledge Base Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Indexing Section */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="text-gray-600" />
            Index Document
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Select a document to process and index into the vector database for AI semantic search.
          </p>
          
          <div className="flex gap-2 mb-4">
            <select 
              className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              <option value="">-- Select a Document --</option>
              {documents.map(doc => (
                <option key={doc._id} value={doc._id}>{doc.title || doc.filename}</option>
              ))}
            </select>
            <button 
              onClick={handleIndex}
              disabled={!selectedDocId || indexingStatus === 'loading'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {indexingStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
              Index for AI
            </button>
          </div>

          {indexingStatus === 'success' && (
            <div className="p-3 bg-green-50 text-green-700 rounded flex items-center gap-2">
              <CheckCircle size={18} /> {indexMessage}
            </div>
          )}
          {indexingStatus === 'error' && (
            <div className="p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
              <AlertCircle size={18} /> {indexMessage}
            </div>
          )}
        </div>

        {/* Test Search Section */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="text-gray-600" />
            Test Semantic Search
          </h2>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input 
              type="text"
              placeholder="Search knowledge base..."
              className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          <div className="mt-4 border-t pt-4 max-h-64 overflow-y-auto space-y-3">
            {searchResults.length === 0 && !isSearching && (
              <p className="text-gray-500 text-sm italic">No results yet. Try searching for something.</p>
            )}
            
            {searchResults.map((result, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded border text-sm">
                <p className="font-semibold text-blue-700 mb-1">{result.documentName} (Page {result.pageNumber})</p>
                <p className="text-gray-700 line-clamp-3">{result.text}</p>
                <div className="mt-2 text-xs text-gray-500">Score: {result.score?.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
