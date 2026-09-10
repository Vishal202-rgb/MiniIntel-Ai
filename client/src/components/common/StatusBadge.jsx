import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const baseClasses = "px-2.5 py-0.5 text-xs font-medium rounded-full capitalize";
  
  const statusStyles = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  };

  const currentStyle = statusStyles[status.toLowerCase()] || "bg-neutral-100 text-neutral-800 dark:bg-dark-card dark:text-neutral-300";

  return (
    <span className={`${baseClasses} ${currentStyle}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
