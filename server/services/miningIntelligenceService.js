const ExtractedRecord = require('../models/ExtractedRecord');
const ragService = require('./ragService');

function parseNumeric(val) {
  if (!val) return null;
  const num = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

exports.analyzeDataAndFindAnomalies = async (reqContext = null) => {
  // 1. Fetch approved structured data
  const records = await ExtractedRecord.find({ status: 'approved' }).populate('documentId', 'originalName title filename');
  
  // Group by parameter (e.g., 'production', 'dispatch', 'target') and by subsidiary/mineName
  const metrics = {};
  
  for (const r of records) {
    if (!r.parameter || !r.value || !r.period) continue;
    const p = r.parameter.toLowerCase().trim();
    
    // Normalize period string to extract a comparable year if possible, but for simplicity, we keep it as string and sort
    const period = r.period.trim();
    
    if (!metrics[p]) metrics[p] = {};
    if (!metrics[p][period]) metrics[p][period] = [];
    metrics[p][period].push(r);
  }

  const anomalies = [];
  let summaryText = "=== DETERMINISTIC HISTORICAL COMPARISONS & ANOMALIES ===\n\n";

  // We will compare consecutive periods if we can sort them.
  // Standard format might be "FY2023", "FY 2024", etc.
  for (const [metricName, periodGroups] of Object.entries(metrics)) {
    const sortedPeriods = Object.keys(periodGroups).sort();
    
    if (sortedPeriods.length < 2) continue; // Need at least two periods to compare
    
    for (let i = 1; i < sortedPeriods.length; i++) {
      const prevPeriod = sortedPeriods[i-1];
      const currPeriod = sortedPeriods[i];
      
      const prevRecords = periodGroups[prevPeriod];
      const currRecords = periodGroups[currPeriod];
      
      // Let's sum them
      const prevVal = prevRecords.reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
      const currVal = currRecords.reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
      const unit = currRecords[0].unit || prevRecords[0].unit || '';
      
      const pageNumbers = [...new Set(currRecords.map(r => r.pageNumber).filter(p => p != null))].join(', ');
      const pageStr = pageNumbers ? `Page(s) ${pageNumbers}` : 'Page N/A';
      
      if (prevVal === 0) continue; // Avoid division by zero
      
      const absChange = currVal - prevVal;
      const pctChange = (absChange / prevVal) * 100;
      
      summaryText += `- Metric: ${metricName.toUpperCase()}\n`;
      summaryText += `  Period: ${prevPeriod} -> ${currPeriod}\n`;
      summaryText += `  Values: ${prevVal} -> ${currVal} ${unit}\n`;
      summaryText += `  Change: ${absChange.toFixed(2)} (${pctChange.toFixed(2)}%)\n`;
      summaryText += `  Source Metadata: ${pageStr}\n\n`;

      // Anomaly detection logic
      let reasonFlagged = null;
      if (pctChange <= -10) {
         reasonFlagged = `${metricName} significantly decreased by ${Math.abs(pctChange).toFixed(1)}%`;
      } else if (pctChange >= 20) {
         reasonFlagged = `${metricName} significantly increased by ${pctChange.toFixed(1)}%`;
      }
      
      if (reasonFlagged) {
        anomalies.push({
          metric: metricName,
          currentValue: currVal,
          comparisonValue: prevVal,
          change: absChange,
          percentage: pctChange,
          period: currPeriod,
          comparisonPeriod: prevPeriod,
          reason: reasonFlagged,
          unit: unit,
          records: currRecords
        });
      }
    }
  }

  // 2. Target vs Production variance
  const prodGroup = metrics['production'] || metrics['coal production'] || {};
  const targetGroup = metrics['target'] || {};
  
  for (const period of Object.keys(prodGroup)) {
    if (targetGroup[period]) {
       const prodVal = prodGroup[period].reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
       const targetVal = targetGroup[period].reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
       if (targetVal > 0) {
         const variance = prodVal - targetVal;
         const pctVariance = (variance / targetVal) * 100;
         
         const pageNumbers = [...new Set(prodGroup[period].map(r => r.pageNumber).filter(p => p != null))].join(', ');
         const pageStr = pageNumbers ? `Page(s) ${pageNumbers}` : 'Page N/A';
         
         summaryText += `- Metric: TARGET VARIANCE\n`;
         summaryText += `  Period: ${period}\n`;
         summaryText += `  Target: ${targetVal} | Actual: ${prodVal}\n`;
         summaryText += `  Variance: ${variance.toFixed(2)} (${pctVariance.toFixed(2)}%)\n`;
         summaryText += `  Source Metadata: ${pageStr}\n\n`;
         
         if (pctVariance <= -10) {
            anomalies.push({
              metric: 'Production vs Target',
              currentValue: prodVal,
              comparisonValue: targetVal,
              change: variance,
              percentage: pctVariance,
              period: period,
              comparisonPeriod: 'Target',
              reason: `Production is significantly below target by ${Math.abs(pctVariance).toFixed(1)}%`,
              unit: prodGroup[period][0].unit || '',
              records: prodGroup[period]
            });
         }
       }
    }
  }

  if (anomalies.length === 0) {
    summaryText += "No significant anomalies detected.\n";
  }

  // 3. Evidence Retrieval for anomalies
  let evidenceText = "=== RAG EVIDENCE FOR ANOMALIES ===\n\n";
  let combinedSources = [];

  const evidencePromises = anomalies.map(async (anom) => {
    const query = `Why did ${anom.metric} ${anom.percentage < 0 ? 'decrease' : 'increase'} or vary in ${anom.period}? Explanations like equipment downtime, weather, constraints, maintenance.`;
    const similarChunks = await ragService.searchSimilar(query, 3, reqContext);
    return { anom, similarChunks };
  });

  const evidenceResults = await Promise.all(evidencePromises);

  for (const { anom, similarChunks } of evidenceResults) {
    evidenceText += `Anomaly: ${anom.reason} in ${anom.period}\n`;
    
    if (similarChunks && similarChunks.length > 0) {
      evidenceText += `Retrieved Evidence:\n`;
      similarChunks.forEach((chunk, i) => {
         const docName = chunk.documentId?.originalName || chunk.documentId?.title || chunk.documentId?.filename || 'Document';
         evidenceText += `[Evidence ${i+1}] Source: ${docName}, Page: ${chunk.pageNumber || 'N/A'}\nText: ${chunk.content}\n\n`;
         combinedSources.push({
            documentId: chunk.documentId,
            pageNumber: chunk.pageNumber,
            similarity: chunk.similarityScore,
            reason: anom.reason,
            text: chunk.content
         });
      });
    } else {
      evidenceText += `No supporting evidence was found in the available documents.\n\n`;
    }
  }

  return { summaryText, evidenceText, anomalies, combinedSources };
};
