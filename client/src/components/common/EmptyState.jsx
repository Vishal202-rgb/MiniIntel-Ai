import React from 'react';
import { FileText } from 'lucide-react';

const EmptyState = ({ title = 'No documents yet', description = 'Upload your first document to get started' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/20">
      <div className="bg-white dark:bg-dark-card p-4 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-800 mb-4">
        <FileText className="w-8 h-8 text-gray-600 dark:text-neutral-500" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
