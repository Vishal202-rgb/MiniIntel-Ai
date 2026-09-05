import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import SourcePanel from './SourcePanel';
import { AlertTriangle, User, Brain } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-dark-card dark:bg-neutral-700 text-white' 
            : isError 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }`}>
          {isUser ? <User size={16} /> : isError ? <AlertTriangle size={16} /> : <Brain size={16} />}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-lg p-4 shadow-sm text-[15px] leading-relaxed ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : isError
                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-tl-sm'
                : 'bg-neutral-50 dark:bg-dark-card border border-slate-200 dark:border-slate-700 text-neutral-800 dark:text-neutral-200 rounded-tl-sm'
          }`}
        >
          <div className={`prose ${isUser ? 'prose-invert' : 'dark:prose-invert'} max-w-none prose-sm sm:prose-base
            prose-p:my-1 prose-headings:mb-2 prose-headings:mt-3 prose-ul:my-1 prose-li:my-0.5 prose-code:before:content-none prose-code:after:content-none
            ${isError ? 'prose-p:text-red-700 dark:prose-p:text-red-300' : ''}
          `}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-neutral-300 dark:divide-gray-200 dark:divide-neutral-700" {...props} />
                  </div>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {!isUser && !isError && message.sources && message.sources.length > 0 && (
            <SourcePanel sources={message.sources} />
          )}
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;
