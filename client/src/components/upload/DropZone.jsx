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
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="w-full mb-8">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
        }`}
      >
        <input {...getInputProps()} />
        <CloudUpload className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-neutral-400 dark:text-neutral-500'}`} />
        <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200 mb-1">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Supports PDF, DOCX, XLSX, CSV, JPG, PNG (Max 50MB)
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
