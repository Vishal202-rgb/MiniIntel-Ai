import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Brain } from 'lucide-react';

const ChatArea = ({ messages, loading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#1A1A1A] space-y-6">
      {messages.length === 0 ? (
        <div className="flex flex-col h-full items-center justify-center text-center text-neutral-400 dark:text-neutral-500 max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">How can I help you today?</h3>
          <p className="text-sm">Start a conversation by typing a question below. I can search through your knowledge base and analyze production data.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {loading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-4 bg-neutral-50 dark:bg-[#222222] border border-neutral-200 dark:border-neutral-800 rounded-bl-sm shadow-sm flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-500 animate-pulse" />
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatArea;
