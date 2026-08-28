import React from 'react';
import { FileText, FileSpreadsheet, Image as ImageIcon, File, Eye, Trash2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const getFileIcon = (fileType) => {
  if (!fileType) return <File className="w-6 h-6 text-gray-600 dark:text-neutral-400" />;
  const type = fileType.toLowerCase();
  if (type.includes('pdf') || type.includes('docx') || type.includes('document')) {
    return <FileText className="w-6 h-6 text-red-500" />;
  }
  if (type.includes('csv') || type.includes('sheet') || type.includes('xlsx')) {
    return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
  }
  if (type.includes('image') || type.includes('jpeg') || type.includes('png')) {
    return <ImageIcon className="w-6 h-6 text-blue-500" />;
  }
  return <File className="w-6 h-6 text-gray-600 dark:text-neutral-400" />;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const DocumentCard = ({ document, onPreview, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      onDelete(document.id || document._id);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-neutral-800 rounded-xl p-3 md:p-4 hover:shadow-md hover:border-blue-500/30 dark:hover:border-gray-500 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 group">
      
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <div className="p-2 bg-gray-50 dark:bg-[#222222] rounded-lg shrink-0">
          {getFileIcon(document.fileType)}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="relative group/title inline-block max-w-full">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate cursor-default">
              {document.originalName}
            </h3>
            {/* Custom Tooltip for filename */}
            <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-medium rounded opacity-0 invisible group-hover/title:opacity-100 group-hover/title:visible transition-all whitespace-nowrap z-20 pointer-events-none shadow-xl border border-neutral-700">
              {document.originalName}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[11px] md:text-xs text-gray-500 dark:text-neutral-400">
            <span className="uppercase font-medium tracking-wide">{document.fileType?.split('/')[1] || document.fileType}</span>
            <span className="text-gray-300 dark:text-neutral-600">•</span>
            <span>{formatSize(document.fileSize)}</span>
            <span className="text-gray-300 dark:text-neutral-600">•</span>
            <span>{new Date(document.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 shrink-0 mt-1 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-neutral-800">
        <StatusBadge status={document.status} className="shrink-0" />
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onPreview(document.id || document._id)}
            className="flex items-center justify-center gap-1 h-[28px] px-3 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:border-blue-800/30 dark:text-blue-400 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          
          <div className="relative">
            <button
              onClick={handleDelete}
              className="flex items-center justify-center h-[28px] w-[28px] text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:border-red-900/30 dark:hover:border-red-800/50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
