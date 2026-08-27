import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const baseClasses = "px-2.5 py-0.5 text-xs font-medium rounded-full capitalize";
  
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  };

  const currentStyle = statusStyles[status.toLowerCase()] || "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <span className={`${baseClasses} ${currentStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
