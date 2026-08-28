import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

const SourcePanel = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-[#1A1A1A] overflow-hidden transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#222222] transition-colors"
      >
        {isOpen ? <ChevronDown size={16} className="mr-1.5 text-neutral-500" /> : <ChevronRight size={16} className="mr-1.5 text-neutral-500" />}
        <span className="flex-1 text-left">Sources ({sources.length})</span>
      </button>
      
      {isOpen && (
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#111111]">
          <ul className="space-y-2.5">
            {sources.map((source, index) => (
              <li key={index} className="flex items-start gap-2">
                <FileText size={15} className="mt-0.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-800 dark:text-neutral-200 leading-snug">
                    {source.documentName || source.documentId?.originalName || 'Unknown Document'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {source.pageNumber && <span>Page {source.pageNumber}</span>}
                    {source.similarity && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                        <span>{Math.round(source.similarity * 100)}% Match</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SourcePanel;
