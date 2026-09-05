import React, { useState } from 'react';
import { Edit2, Check, X, CheckSquare } from 'lucide-react';

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
    return <div className="p-5 text-center text-gray-500 dark:text-slate-400">No records found. Select a document and extract data.</div>;
  }

  return (
    <div>
      <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-bg">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {records.length} records found
        </span>
        <button
          onClick={handleBulk}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          Approve Selected ({selectedIds.size})
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
          <thead className="bg-slate-100 dark:bg-dark-card border-b dark:border-slate-700 text-xs uppercase text-gray-600 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  onChange={handleSelectAll}
                  checked={records.length > 0 && selectedIds.size === records.length}
                />
              </th>
              <th className="px-4 py-3">Parameter</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Mine</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const id = record.id || record._id;
              return (
                <tr key={id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={selectedIds.has(id)}
                      onChange={() => handleSelect(id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{record.parameter}</td>
                  <td className="px-4 py-3">{record.value}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{record.unit}</td>
                  <td className="px-4 py-3">{record.period}</td>
                  <td className="px-4 py-3">{record.mine}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${record.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      ${record.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                      ${record.status === 'pending' || !record.status ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                    `}>
                      {record.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onApprove(id)} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded" title="Approve">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => onReject(id)} className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" title="Reject">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(record)} className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded" title="Edit">
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
