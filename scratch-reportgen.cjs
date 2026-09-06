const fs = require('fs');
let content = fs.readFileSync('./client/src/pages/ReportGenerator.jsx', 'utf8');

// Replace p-5 space-y-4 with p-4 space-y-3 in controls panel
content = content.replace(
  '<div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-5 rounded-lg space-y-4">',
  '<div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 p-4 rounded-lg space-y-3">'
);

// Replace label bottom margins mb-2 with mb-1
content = content.replace(/mb-2/g, 'mb-1');

fs.writeFileSync('./client/src/pages/ReportGenerator.jsx', content, 'utf8');
console.log('Done ReportGenerator config panel');
