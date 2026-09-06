import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const RecordEditor = ({ record, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    value: record.value || '',
    unit: record.unit || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-[#2d3139] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-[#f1f5f9] placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-[#64748b] uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-[#2d3139]">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-[#2d3139] bg-slate-50/50 dark:bg-[#1c1f26]/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Extracted Record</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#ffffff0a] rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Parameter</label>
            <input 
              type="text" 
              value={record.parameter || ''} 
              disabled 
              className="w-full bg-slate-50 dark:bg-[#1c1f26]/50 border border-slate-200 dark:border-[#2d3139] rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-[#64748b] cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className={labelClass}>Value</label>
            <input 
              type="text" 
              name="value"
              value={formData.value} 
              onChange={handleChange}
              className={inputClass}
              autoFocus
            />
          </div>
          
          <div>
            <label className={labelClass}>Unit</label>
            <input 
              type="text" 
              name="unit"
              value={formData.unit} 
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-[#2d3139]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-[#94a3b8] hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#ffffff0a] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordEditor;
