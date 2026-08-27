import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const ChatArea = ({ messages }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-400">
          Start a conversation by typing a question below.
        </div>
      ) : (
        messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatArea;
