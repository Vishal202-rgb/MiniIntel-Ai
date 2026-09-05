import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Loader2, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { indexDocument, searchKnowledgeBase } from '../services/apiRag';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [indexingStatus, setIndexingStatus] = useState(null); // 'loading', 'success', 'error'
  const [indexMessage, setIndexMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const location = useLocation();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      executeSearch(q);
    }
  }, [location.search]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/api/documents');
      // Filter for documents that are ready to be indexed
      const eligibleDocs = res.data.filter(doc => doc.status === 'completed' || doc.status === 'extracted');
      setDocuments(eligibleDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  };

  const handleIndex = async () => {
    if (!selectedDocId) return;
    setIndexingStatus('loading');
    setIndexMessage('');
    try {
      await indexDocument(selectedDocId);
      setIndexingStatus('success');
      setIndexMessage('Document indexed successfully for AI Semantic Search.');
    } catch (error) {
      setIndexingStatus('error');
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to index document.';
      setIndexMessage(errorMsg);
    }
  };

  const executeSearch = async (queryToSearch) => {
    if (!queryToSearch.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);
    try {
      const data = await searchKnowledgeBase(queryToSearch);
      setSearchResults(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([{
        isError: true,
        documentName: 'Error',
        pageNumber: '-',
        text: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to search.'
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Knowledge Base Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Indexing Section */}
        <div className="bg-white dark:bg-dark-card p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-blue-500 w-6 h-6" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Index Document</h2>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
            Select a processed document to generate embeddings and index it into the vector database for AI querying.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <select 
                className="w-full appearance-none bg-slate-50/50 dark:bg-dark-card/40 border border-slate-200 dark:border-slate-600 text-neutral-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors cursor-pointer"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                <option value="" className="text-gray-500 dark:text-slate-400">-- Select a Document --</option>
                {documents.map(doc => (
                  <option key={doc._id} value={doc._id}>{doc.originalName || doc.title || doc.filename}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-slate-400">
                <ChevronDown size={18} />
              </div>
            </div>
            
            <button 
              onClick={handleIndex}
              disabled={!selectedDocId || indexingStatus === 'loading'}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm shrink-0"
            >
              {indexingStatus === 'loading' && <Loader2 size={18} className="animate-spin" />}
              Index for AI
            </button>
          </div>

          {/* Indexing Status Feedback */}
          {indexingStatus === 'success' && (
            <div className="mt-auto p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-lg flex items-start gap-3 shadow-sm">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{indexMessage}</div>
            </div>
          )}
          {indexingStatus === 'error' && (
            <div className="mt-auto p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-3 shadow-sm">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{indexMessage}</div>
            </div>
          )}
        </div>

        {/* Semantic Search Section */}
        <div className="bg-white dark:bg-dark-card p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <Search className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Semantic Search</h2>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 shrink-0">
            Query the vector database directly to see what chunks the AI retrieves for context.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-3 mb-6 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-slate-400" />
              <input 
                type="text"
                placeholder="e.g., 'coal production and dispatch'"
                className="w-full bg-slate-50/50 dark:bg-dark-card/40 border border-slate-200 dark:border-slate-600 text-neutral-900 dark:text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <button 
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {!hasSearched ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 dark:text-slate-400">
                <Search className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Run a query to see semantic search results.</p>
              </div>
            ) : isSearching ? (
              <div className="h-full flex flex-col items-center justify-center text-blue-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Searching vector space...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 dark:text-slate-400">
                <AlertTriangle className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">No results found.</p>
                <p className="text-xs mt-1 text-center">Try using different keywords or indexing more documents.</p>
              </div>
            ) : (
              searchResults.map((result, idx) => {
                if (result.isError) {
                  return (
                    <div key={idx} className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">{result.text}</p>
                    </div>
                  );
                }

                const docName = result.documentName || (result.documentId && (result.documentId.originalName || result.documentId.filename)) || 'Unknown Document';
                const textContent = result.text || result.content || result.chunk || '';
                const score = result.score !== undefined ? result.score : result.similarityScore;
                
                return (
                  <div key={idx} className="hover-lift p-4 bg-neutral-50 dark:bg-dark-bg border border-slate-200 dark:border-slate-700 rounded-lg group transition-colors">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h3 className="font-semibold text-blue-600 dark:text-blue-400 text-sm line-clamp-1">
                        {docName}
                      </h3>
                      {score !== undefined && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                          Match: {Math.round(score * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-4 leading-relaxed mb-2">
                      {textContent}
                    </p>
                    {result.pageNumber && (
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <FileText size={12} /> Page {result.pageNumber}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
