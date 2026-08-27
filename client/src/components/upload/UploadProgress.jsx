import React from 'react';
import { FileUp, X } from 'lucide-react';

const UploadProgress = ({ uploads, onDismiss }) => {
  if (!uploads || uploads.length === 0) return null;

  return (
    <div className="w-full space-y-3 mb-8">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="flex items-center gap-4 bg-white dark:bg-dark-card border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl shadow-sm"
        >
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {upload.name}
              </span>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {upload.status === 'uploading' ? `${upload.progress}%` : upload.status === 'error' ? 'Failed' : 'Completed'}
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  upload.status === 'error'
                    ? 'bg-red-500'
                    : upload.status === 'success'
                    ? 'bg-green-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${upload.progress}%` }}
              ></div>
            </div>
            {upload.error && (
              <p className="text-xs text-red-500 mt-1">{upload.error}</p>
            )}
          </div>
          {(upload.status === 'success' || upload.status === 'error') && (
            <button
              onClick={() => onDismiss(upload.id)}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default UploadProgress;
