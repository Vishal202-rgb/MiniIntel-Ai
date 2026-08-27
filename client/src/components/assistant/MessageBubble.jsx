import React from 'react';
import ReactMarkdown from 'react-markdown';
import SourcePanel from './SourcePanel';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
          isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'
        }`}
      >
        <div className={`prose ${isUser ? 'prose-invert' : ''} max-w-none prose-sm`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcePanel sources={message.sources} />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
