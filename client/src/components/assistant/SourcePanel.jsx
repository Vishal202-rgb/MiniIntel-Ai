import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

const SourcePanel = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 text-sm border rounded bg-gray-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
      >
        {isOpen ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />}
        Sources ({sources.length})
      </button>
      {isOpen && (
        <div className="p-3 border-t">
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="flex items-start">
                <FileText size={14} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>
                  <span className="font-semibold">{source.documentName || 'Unknown Document'}</span>
                  {source.pageNumber && <span className="text-gray-500 ml-1">(Page {source.pageNumber})</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SourcePanel;
