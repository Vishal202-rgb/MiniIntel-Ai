import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload } from 'lucide-react';

const DropZone = ({ onUpload }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        onUpload(file);
      });
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="w-full mb-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-dark-bg/50'
        }`}
      >
        <input {...getInputProps()} />
        <CloudUpload className={`w-8 h-8 mb-3 ${isDragActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-400'}`} />
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Supports PDF, DOCX, XLSX, PPTX, CSV, JPG, PNG (Max 50MB)
        </p>
      </div>
      {fileRejections.length > 0 && (
        <div className="mt-4">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.path} className="text-sm text-red-600 dark:text-red-400">
              {file.name}: {errors[0].message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropZone;
