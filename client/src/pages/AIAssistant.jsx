import React, { useState, useEffect } from 'react';
import { Send, Plus, MessageSquare, AlertTriangle } from 'lucide-react';
import { askQuestion, getConversations, getConversation } from '../services/apiAi';
import ChatArea from '../components/assistant/ChatArea';

const AIAssistant = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const data = await getConversation(id);
      setCurrentConvId(id);
      setMessages(data.messages || []);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(userMessage.content, currentConvId);
      if (res.conversationId && !currentConvId) {
        setCurrentConvId(res.conversationId);
        loadConversations();
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer, sources: res.sources }]);
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#1A1A1A] shadow-sm relative">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-20">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-300 shadow-md border border-neutral-200 dark:border-neutral-700"
        >
          <MessageSquare size={18} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 bg-neutral-50 dark:bg-[#111111] border-r border-neutral-200 dark:border-neutral-800 flex-col absolute md:relative z-10 h-full`}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 mt-12 md:mt-0">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => loadConversation(conv._id)}
              className={`w-full flex items-center gap-3 p-3 text-left rounded-lg transition-colors ${
                currentConvId === conv._id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' 
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800/50'
              }`}
            >
              <MessageSquare size={16} className={currentConvId === conv._id ? 'text-blue-600 dark:text-blue-500' : 'text-neutral-500 dark:text-neutral-400'} />
              <span className="truncate text-sm">{conv.title || 'Untitled Conversation'}</span>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="text-center p-4 text-sm text-neutral-500 dark:text-neutral-400">
              No conversations yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1A] w-full">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 md:hidden flex justify-center items-center">
          <span className="font-semibold text-neutral-900 dark:text-white">AI Assistant</span>
        </div>
        
        <ChatArea messages={messages} loading={loading} />
        
        {/* Input Area */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1A1A1A]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 relative items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask a question about your documents... (Shift+Enter for new line)"
              className="flex-1 p-3 min-h-[52px] max-h-32 resize-none border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-[#111111] text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
              disabled={loading}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-3 h-[52px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm shrink-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
          <div className="max-w-4xl mx-auto text-center mt-2">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-500">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
