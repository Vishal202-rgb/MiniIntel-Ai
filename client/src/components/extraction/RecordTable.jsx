import React, { useState } from 'react';
import { Edit2, Check, X, CheckSquare, ShieldAlert, ShieldCheck } from 'lucide-react';

const RecordTable = ({ records, onEdit, onApprove, onReject, onBulkApprove }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(records.map(r => r.id || r._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulk = () => {
    if (selectedIds.size > 0) {
      onBulkApprove(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-dark-card border border-slate-200 dark:border-[#2d3139] rounded-lg">
        No records extracted yet. Click "Extract Data" to process the selected document.
      </div>
    );
  }

  const thClass = "px-4 py-3 font-semibold text-xs uppercase tracking-wider";
  const tdClass = "px-4 py-3 align-middle text-sm border-b border-slate-100 dark:border-[#2d3139]/60 leading-relaxed";

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-[#2d3139] rounded-lg overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-[#2d3139] flex justify-between items-center bg-slate-50 dark:bg-[#1c1f26]">
        <span className="text-xs font-semibold text-gray-600 dark:text-[#94a3b8] uppercase tracking-wider">
          {records.length} records found
        </span>
        <button
          onClick={handleBulk}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Approve Selected ({selectedIds.size})
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-gray-800 dark:text-[#f1f5f9] border-collapse m-0">
          <thead className="bg-slate-50/80 dark:bg-[#1c1f26] text-gray-700 dark:text-[#94a3b8] border-b border-slate-200 dark:border-[#2d3139]">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-bg text-amber-500 focus:ring-amber-500 cursor-pointer"
                  onChange={handleSelectAll}
                  checked={records.length > 0 && selectedIds.size === records.length}
                />
              </th>
              <th className={thClass}>Parameter</th>
              <th className={thClass}>Value / Unit</th>
              <th className={thClass}>Confidence</th>
              <th className={thClass}>Source / Pg</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const id = record.id || record._id;
              const conf = record.confidenceScore !== undefined ? (record.confidenceScore * 100).toFixed(0) : null;
              
              return (
                <tr key={id} className="hover:bg-slate-50 dark:hover:bg-[#ffffff05] transition-colors">
                  <td className={tdClass}>
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-dark-bg text-amber-500 focus:ring-amber-500 cursor-pointer"
                      checked={selectedIds.has(id)}
                      onChange={() => handleSelect(id)}
                    />
                  </td>
                  <td className={`${tdClass} font-medium`}>{record.parameter}</td>
                  <td className={tdClass}>
                    <span className="font-semibold text-gray-900 dark:text-white">{record.value}</span>
                    {record.unit && <span className="text-gray-500 dark:text-slate-400 ml-1.5 text-xs">{record.unit}</span>}
                  </td>
                  <td className={tdClass}>
                    {conf ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full ${conf >= 90 ? 'bg-emerald-500' : conf >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${conf}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-600 dark:text-slate-400 font-semibold">{conf}%</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-500 dark:text-slate-500 font-medium">-</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-gray-600 dark:text-slate-300 truncate max-w-[120px]" title={record.mine || 'N/A'}>{record.mine || 'N/A'}</span>
                      <span className="text-gray-400 dark:text-slate-600">|</span>
                      <span className="text-gray-500 dark:text-slate-400 font-medium">Pg {record.pageNumber || '-'}</span>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shrink-0
                      ${record.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                      ${record.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                      ${record.status === 'pending' || !record.status ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                    `}>
                      {record.status === 'pending' || !record.status ? <ShieldAlert className="w-3 h-3" /> : null}
                      {record.status === 'approved' ? <ShieldCheck className="w-3 h-3" /> : null}
                      {record.status || 'pending'}
                    </span>
                  </td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => onApprove(id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors" title="Approve">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => onReject(id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Reject">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(record)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecordTable;
