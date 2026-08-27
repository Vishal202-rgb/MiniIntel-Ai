import React from 'react';
import DocumentCard from './DocumentCard';
import EmptyState from '../common/EmptyState';

const DocumentList = ({ documents, loading, onPreview, onDelete }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white dark:bg-dark-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 animate-pulse">
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
