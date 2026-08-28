import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, children, title, maxWidth = 'max-w-4xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      ></div>
      <div 
        className={`relative w-full ${maxWidth} bg-white dark:bg-dark-card rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 truncate pr-4">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
