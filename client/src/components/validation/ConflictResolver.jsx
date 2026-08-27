import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const ConflictResolver = ({ issue, onResolve, onCancel }) => {
  const [correctedValue, setCorrectedValue] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve({ correctedValue, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            Resolve Issue
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Issue Details:</p>
          <p className="text-sm text-red-700 dark:text-red-400">{issue.message || 'Validation error detected on this field.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document</label>
            <input type="text" value={issue.document || ''} disabled className="w-full border dark:border-gray-700 rounded p-2 bg-gray-100 dark:bg-gray-900 text-gray-500" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field</label>
            <input type="text" value={issue.field || ''} disabled className="w-full border dark:border-gray-700 rounded p-2 bg-gray-100 dark:bg-gray-900 text-gray-500" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Corrected Value</label>
            <input 
              type="text" 
              value={correctedValue} 
              onChange={(e) => setCorrectedValue(e.target.value)}
              className="w-full border dark:border-gray-700 rounded p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              placeholder="Enter correct value..."
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border dark:border-gray-700 rounded p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={2}
              placeholder="Why was this changed?"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
            >
              Apply Resolution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConflictResolver;
