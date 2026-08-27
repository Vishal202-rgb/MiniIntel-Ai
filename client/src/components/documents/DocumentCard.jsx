import React from 'react';
import { FileText, FileSpreadsheet, Image as ImageIcon, File, Eye, Trash2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const getFileIcon = (fileType) => {
  if (!fileType) return <File className="w-8 h-8 text-neutral-400" />;
  const type = fileType.toLowerCase();
  if (type.includes('pdf') || type.includes('docx') || type.includes('document')) {
    return <FileText className="w-8 h-8 text-red-500" />;
  }
  if (type.includes('csv') || type.includes('sheet') || type.includes('xlsx')) {
    return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
  }
  if (type.includes('image') || type.includes('jpeg') || type.includes('png')) {
    return <ImageIcon className="w-8 h-8 text-blue-500" />;
  }
  return <File className="w-8 h-8 text-neutral-400" />;
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
    <div className="bg-white dark:bg-dark-card border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:shadow-md dark:hover:border-neutral-600 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3 items-start">
          <div className="p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            {getFileIcon(document.fileType)}
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate w-40 md:w-32 lg:w-40" title={document.originalName}>
              {document.originalName}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="uppercase">{document.fileType?.split('/')[1] || document.fileType}</span>
              <span>•</span>
              <span>{formatSize(document.fileSize)}</span>
            </div>
            <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              {new Date(document.uploadedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <StatusBadge status={document.status} />
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPreview(document.id || document._id)}
            className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-md transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
