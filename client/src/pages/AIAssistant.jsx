import React, { useState, useEffect } from 'react';
import { Send, Plus, MessageSquare } from 'lucide-react';
import { askQuestion, getConversations, getConversation } from '../services/apiAi';
import ChatArea from '../components/assistant/ChatArea';

const AIAssistant = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = () => {
    setCurrentConvId(null);
    setMessages([]);
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
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] border-t">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => loadConversation(conv._id)}
              className={`w-full flex items-center gap-2 p-3 text-left rounded hover:bg-gray-200 transition-colors ${
                currentConvId === conv._id ? 'bg-gray-200 font-medium' : 'text-gray-700'
              }`}
            >
              <MessageSquare size={16} />
              <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <ChatArea messages={messages} />
        
        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
