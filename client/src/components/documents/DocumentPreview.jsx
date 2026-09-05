import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const DocumentPreview = ({ document: docData, isOpen, onClose, onRetry }) => {
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCurrentPage(0);
  }, [docData]);

  if (!docData) return null;

  const doc = docData.document || docData;
  const pages = docData.pages || [];
  const totalPages = pages.length;

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={doc.originalName}>
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between text-sm bg-neutral-50 dark:bg-dark-bg/50">
        <div className="flex flex-wrap gap-4 text-neutral-600 dark:text-slate-400">
          <div>
            <span className="font-medium text-neutral-900 dark:text-neutral-200 mr-2">Type:</span>
            <span className="uppercase">{doc.fileType}</span>
          </div>
          <div>
            <span className="font-medium text-neutral-900 dark:text-neutral-200 mr-2">Size:</span>
            {formatSize(doc.fileSize)}
          </div>
          <div>
            <span className="font-medium text-neutral-900 dark:text-neutral-200 mr-2">Pages:</span>
            {totalPages}
          </div>
          <div>
            <span className="font-medium text-neutral-900 dark:text-neutral-200 mr-2">Uploaded:</span>
            {new Date(doc.uploadedAt).toLocaleDateString()}
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <div className="p-5 min-h-[400px]">
        {doc.status === 'pending' || doc.status === 'processing' ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Document is processing. Please wait...</p>
          </div>
        ) : doc.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <p className="mb-4">Processing failed: {doc.error || 'Unknown error'}</p>
            <button
              onClick={() => onRetry(doc._id || doc.id)}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Retry Processing
            </button>
          </div>
        ) : totalPages > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                Extracted Content
              </h3>
              {totalPages > 1 && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-dark-card disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-slate-400" />
                  </button>
                  <span className="text-sm text-neutral-600 dark:text-slate-400">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages - 1}
                    className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-dark-card disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-slate-400" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-neutral-50 dark:bg-dark-bg p-5 rounded-lg border border-slate-200 dark:border-slate-700 max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-neutral-800 dark:text-neutral-300 text-sm leading-relaxed">
                {pages[currentPage]?.content || 'No text extracted for this page.'}
              </pre>
            </div>
            <div className="mt-2 text-right text-xs text-gray-500 dark:text-slate-400">
              Word count: {pages[currentPage]?.wordCount || 0}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400">
            No content available.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentPreview;
