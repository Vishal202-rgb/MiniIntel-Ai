import React from 'react';
import { FileText, FileSpreadsheet, Image as ImageIcon, File, Eye, Trash2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const getFileIcon = (fileType) => {
  if (!fileType) return <File className="w-6 h-6 text-neutral-400" />;
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
  return <File className="w-6 h-6 text-neutral-400" />;
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
    <div className="bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 hover:shadow-md dark:hover:border-neutral-700 transition-all duration-200 flex flex-col h-full group">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2.5 bg-neutral-50 dark:bg-[#222222] rounded-lg shrink-0">
          {getFileIcon(document.fileType)}
        </div>
        <div className="min-w-0 flex-1 relative">
          
          <div className="relative group/title">
            <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate cursor-default">
              {document.originalName}
            </h3>
            {/* Custom Tooltip for filename */}
            <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-medium rounded opacity-0 invisible group-hover/title:opacity-100 group-hover/title:visible transition-all whitespace-nowrap z-20 pointer-events-none shadow-xl border border-neutral-700">
              {document.originalName}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="uppercase font-medium tracking-wide">{document.fileType?.split('/')[1] || document.fileType}</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>{formatSize(document.fileSize)}</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>{new Date(document.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <StatusBadge status={document.status} />
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPreview(document.id || document._id)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          
          <div className="relative group/btn">
            <button
              onClick={handleDelete}
              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {/* Custom Tooltip for Delete button */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-neutral-900 dark:bg-neutral-800 text-white text-[10px] font-medium rounded opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all whitespace-nowrap z-20 pointer-events-none shadow-xl border border-neutral-700">
              Delete Document
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
