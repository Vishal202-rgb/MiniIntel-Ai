import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const DocumentFilters = ({ onSearchChange, onTypeChange, onStatusChange, search, type, status }) => {
  const [localSearch, setLocalSearch] = useState(search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-card border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
        />
      </div>
      <select
        value={type || ''}
        onChange={(e) => onTypeChange(e.target.value)}
        className="px-4 py-2 bg-white dark:bg-dark-card border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
      >
        <option value="">All Types</option>
        <option value="pdf">PDF</option>
        <option value="docx">DOCX</option>
        <option value="xlsx">XLSX</option>
        <option value="csv">CSV</option>
        <option value="image">Image</option>
      </select>
      <select
        value={status || ''}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-4 py-2 bg-white dark:bg-dark-card border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
};

export default DocumentFilters;
