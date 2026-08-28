import React from 'react';
import DocumentCard from './DocumentCard';
import EmptyState from '../common/EmptyState';

const DocumentList = ({ documents, loading, onPreview, onDelete }) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white dark:bg-dark-card border border-gray-200 dark:border-neutral-800 rounded-xl p-4 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg shrink-0"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-48"></div>
                <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-gray-200 dark:bg-neutral-700 rounded-full"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id || doc._id}
          document={doc}
          onPreview={onPreview}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default DocumentList;
