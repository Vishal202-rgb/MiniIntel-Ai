import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Plus, MessageSquare, Loader2, History, X } from 'lucide-react';
import { askQuestion, getConversations, getConversation } from '../services/apiAi';
import ChatArea from '../components/assistant/ChatArea';

const AIAssistant = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // Asking question
  const [convLoading, setConvLoading] = useState(false); // Fetching conversation history
  const [listLoading, setListLoading] = useState(false);
  const [convError, setConvError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await getConversations();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setConversations(list);
      return list;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    setConvLoading(true);
    setConvError(null);
    try {
      const data = await getConversation(id);
      const convData = data?.data || data;
      const rawMessages = convData?.messages || [];
      
      setCurrentConvId(id);
      setMessages(rawMessages);
      
      // Persist across navigation & page refresh
      setSearchParams((prev) => {
        if (prev.get('id') === id) return prev;
        return { id };
      });
      localStorage.setItem('mineintel_active_conv_id', id);
      
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      const errMsg = error.response?.data?.message || error.formattedMessage || error.message || 'Conversation could not be loaded.';
      setConvError(errMsg);
    } finally {
      setConvLoading(false);
    }
  }, [setSearchParams]);

  // Initial mount & hydration from URL or localStorage
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      await loadConversations();
      const urlId = searchParams.get('id') || searchParams.get('conversationId');
      const savedId = localStorage.getItem('mineintel_active_conv_id');
      const targetId = urlId || savedId;

      if (targetId) {
        await loadConversation(targetId);
      }
    };

    initialize();
  }, [loadConversations, loadConversation, searchParams]);

  const handleNewConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput('');
    setConvError(null);
    setSearchParams({});
    localStorage.removeItem('mineintel_active_conv_id');
    if (window.innerWidth < 768) setSidebarOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || convLoading) return;

    const queryText = input.trim();
    const userMessage = { role: 'user', content: queryText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(queryText, currentConvId);
      const newConvId = res.conversationId || currentConvId;
      if (newConvId && newConvId !== currentConvId) {
        setCurrentConvId(newConvId);
        setSearchParams({ id: newConvId });
        localStorage.setItem('mineintel_active_conv_id', newConvId);
        loadConversations();
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          confidence: res.confidence,
          citations: res.citations,
          evidence: res.evidence,
          calculation: res.calculation,
          insufficientEvidence: res.insufficientEvidence,
          sources: res.sources,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error asking question:', error);
      const errMsg = error.response?.data?.message || error.formattedMessage || error.message || 'Failed to process inquiry.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Inquiry could not be processed: ${errMsg}`,
          isError: true,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = (sampleQuery) => {
    setInput(sampleQuery);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Restrict displayed history to exactly the 2 most recent conversations by default
  const displayedConversations = showAllHistory ? conversations : conversations.slice(0, 2);
  const activeConv = conversations.find((c) => (c.id || c._id) === currentConvId);
  const activeTitle = activeConv?.title;

  return (
    <div className="flex h-[calc(100vh-6.25rem)] md:h-[calc(100vh-7.25rem)] max-h-[calc(100vh-6.25rem)] md:max-h-[calc(100vh-7.25rem)] border border-slate-200 dark:border-[#2B3245] rounded-xl overflow-hidden bg-white dark:bg-[#161B26] shadow-sm relative w-full">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* History Sidebar - Compact ~260-280px */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:relative z-40 md:z-auto top-0 bottom-0 left-0 w-72 md:w-64 lg:w-72 shrink-0 bg-slate-50 dark:bg-[#0B0E14] border-r border-slate-200 dark:border-[#2B3245] flex flex-col h-full transition-transform duration-200 ease-in-out shadow-xl md:shadow-none`}
      >
        {/* Mobile Header / Close */}
        <div className="md:hidden p-3 border-b border-slate-200 dark:border-[#2B3245] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Consultation History</span>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-200 dark:border-[#2B3245] shrink-0">
          <button
            type="button"
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-copper-600 hover:bg-copper-700 text-white py-2 px-3.5 rounded-lg transition-colors font-semibold text-xs shadow-xs"
          >
            <Plus size={15} /> New Intelligence Chat
          </button>
        </div>

        {/* Sidebar Title & Count Badge */}
        <div className="px-3.5 py-2 border-b border-slate-200/60 dark:border-[#2B3245]/60 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Recent Consultations
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#1F2430] text-slate-600 dark:text-slate-400 font-mono">
            {showAllHistory ? `${conversations.length} total` : `${Math.min(2, conversations.length)} recent`}
          </span>
        </div>

        {/* List of Conversations (Only 2 by default!) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {listLoading && conversations.length === 0 && (
            <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-copper-500" />
              <span>Loading records...</span>
            </div>
          )}

          {displayedConversations.map((conv) => {
            const convId = conv.id || conv._id;
            const isSelected = currentConvId === convId;
            return (
              <button
                key={convId}
                type="button"
                onClick={() => loadConversation(convId)}
                className={`w-full flex items-start gap-2.5 p-2.5 text-left rounded-md transition-colors ${
                  isSelected 
                    ? 'bg-slate-200/80 dark:bg-[#1F2430] text-slate-900 dark:text-white font-medium border-l-2 border-copper-500 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-[#161B26]'
                }`}
              >
                <MessageSquare size={14} className={isSelected ? 'text-copper-500 shrink-0 mt-0.5' : 'text-slate-400 shrink-0 mt-0.5'} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs leading-snug">{conv.title || 'Untitled Consultation'}</p>
                  {conv.updatedAt && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {!listLoading && conversations.length === 0 && (
            <div className="text-center p-6 text-xs text-slate-400 dark:text-slate-500">
              No previous consultations recorded.
            </div>
          )}
        </div>

        {/* Optional Toggle for Older History if > 2 exist */}
        {conversations.length > 2 && (
          <div className="p-2 border-t border-slate-200 dark:border-[#2B3245] shrink-0 bg-slate-50 dark:bg-[#0B0E14]">
            <button
              type="button"
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="w-full py-1.5 px-2 text-[11px] font-medium text-copper-600 dark:text-copper-400 hover:text-copper-700 dark:hover:text-copper-300 hover:bg-copper-500/10 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <History size={13} />
              <span>{showAllHistory ? 'Show only 2 recent chats' : `View older history (${conversations.length - 2} more)`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Conversation Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-white dark:bg-[#161B26] relative">
        
        {/* Panel Header */}
        <div className="p-2.5 px-4 border-b border-slate-200 dark:border-[#2B3245] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#0E121A]">
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1F2430] rounded-md border border-slate-200 dark:border-[#2B3245] shrink-0"
              aria-label="Toggle history"
            >
              <MessageSquare size={15} />
            </button>
            <div className="truncate">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                {currentConvId ? (activeTitle || 'Mining Intelligence Consultation') : 'New Operations Consultation'}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] hidden sm:block">
                Evidence-grounded mining intelligence • Production, dispatch & DGMS statutory analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1F2430] border border-slate-200 dark:border-[#2B3245] text-[10px] font-mono text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Grounding Active</span>
            </div>
            {currentConvId && (
              <button
                type="button"
                onClick={handleNewConversation}
                className="text-[11px] font-medium text-copper-600 dark:text-copper-400 hover:text-copper-700 dark:hover:text-copper-300 px-2 py-1 rounded hover:bg-copper-500/10 flex items-center gap-1 transition-colors"
              >
                <Plus size={13} />
                <span>New Chat</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Messages Stream (Independently scrollable) */}
        <ChatArea 
          messages={messages} 
          loading={loading} 
          convLoading={convLoading} 
          convError={convError} 
          onSampleClick={handleSampleClick} 
        />
        
        {/* Sticky Ask / Search Input Box */}
        <div className="p-3 sm:p-3.5 border-t border-slate-200 dark:border-[#2B3245] bg-slate-50/95 dark:bg-[#0E121A] shrink-0 sticky bottom-0 z-10 backdrop-blur-xs">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 relative items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask a question about mining reports, production variance, or statutory compliance... (Shift+Enter for newline)"
              className="flex-1 p-2.5 min-h-[46px] max-h-28 resize-none border border-slate-300 dark:border-[#2B3245] rounded-lg bg-white dark:bg-[#0B0E14] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-copper-500 focus:border-copper-500 text-xs shadow-xs transition-shadow placeholder:text-slate-400 dark:placeholder:text-slate-600"
              disabled={loading || convLoading}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || convLoading}
              className="px-4 py-2.5 h-[46px] bg-copper-600 hover:bg-copper-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-xs shrink-0 text-xs font-semibold"
              aria-label="Send Inquiry"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          <div className="max-w-4xl mx-auto text-center mt-1.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              MineIntel AI answers are 100% grounded in uploaded documents and deterministic calculations.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAssistant;
