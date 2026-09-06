const fs = require('fs');
let content = fs.readFileSync('client/src/pages/AnalyticsDashboard.jsx', 'utf8');

// Fix h2 classes
content = content.replace(/<h2 className="-4">/g, '<h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">');

// Fix chart colors
content = content.replace(/#6366f1/g, '#3b82f6'); // Indigo -> Blue
content = content.replace(/#8b5cf6/g, '#64748b'); // Purple -> Slate (Actual Production)
content = content.replace(/#f43f5e/g, '#3b82f6'); // Rose Target -> Blue Target line

fs.writeFileSync('client/src/pages/AnalyticsDashboard.jsx', content, 'utf8');
