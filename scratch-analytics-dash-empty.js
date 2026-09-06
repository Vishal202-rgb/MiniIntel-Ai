const fs = require('fs');
let content = fs.readFileSync('client/src/pages/AnalyticsDashboard.jsx', 'utf8');

// Replace the Main Charts Row with an empty state wrapper
const chartRowMatch = content.match(/<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">([\s\S]*?)<\/div>\s*\{\/\* AI Insights \*\/\}/);
if (chartRowMatch) {
  const chartRow = chartRowMatch[0];
  const newChartRow = chartRow.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">',
    \{productionData && productionData.length > 0 ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">\
  ).replace(
    '</div>\n\n      {/* AI Insights */}',
    \      </div>
    ) : (
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-lg p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">No Data Available</h3>
        <p className="text-slate-500 max-w-md">
          Upload and extract production documents to generate dynamic analytics and charts.
        </p>
      </div>
    )}

      {/* AI Insights */}\
  );
  content = content.replace(chartRow, newChartRow);
  fs.writeFileSync('client/src/pages/AnalyticsDashboard.jsx', content, 'utf8');
  console.log('Replaced charts with empty state conditional');
} else {
  console.log('Could not find chart row');
}

