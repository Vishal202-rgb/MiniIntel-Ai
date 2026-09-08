const ExtractedRecord = require('../models/ExtractedRecord');
const ragService = require('./ragService');

function parseNumeric(val) {
  if (val === null || val === undefined) return null;
  const cleaned = val.toString().replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

exports.analyzeDataAndFindAnomalies = async (options = {}) => {
  const reqContext = options.reqContext || (options.isComplex !== undefined ? options : null);
  const filters = options.filters || {};
  const documentId = options.documentId || filters.documentId || filters.document;
  const mineName = options.mineName || filters.mine || filters.mineName;
  const period = options.period || filters.period;
  const subsidiary = options.subsidiary || filters.subsidiary;

  // 1. Fetch scoped structured data
  const recordQuery = {};
  if (documentId) {
    recordQuery.documentId = documentId;
  }
  if (mineName) {
    recordQuery.mineName = new RegExp(mineName, 'i');
  }
  if (subsidiary) {
    recordQuery.subsidiary = new RegExp(subsidiary, 'i');
  }
  if (period) {
    recordQuery.period = new RegExp(period, 'i');
  }

  // Prioritize approved records; fall back to all records if none approved yet
  let records = await ExtractedRecord.find({ ...recordQuery, status: 'approved' })
    .populate('documentId', 'originalName title filename')
    .lean();

  if (records.length === 0 && documentId) {
    records = await ExtractedRecord.find({ documentId })
      .populate('documentId', 'originalName title filename')
      .lean();
  } else if (records.length === 0 && Object.keys(recordQuery).length > 0) {
    records = await ExtractedRecord.find(recordQuery)
      .populate('documentId', 'originalName title filename')
      .limit(50)
      .lean();
  }

  // Fallback to general approved records if still empty (capped at 40)
  if (records.length === 0) {
    records = await ExtractedRecord.find({ status: 'approved' })
      .populate('documentId', 'originalName title filename')
      .limit(40)
      .lean();
  }

  // Group by parameter ('production', 'dispatch', 'target', 'overburden', etc.)
  const metrics = {};
  const mineBreakdown = {};

  for (const r of records) {
    if (!r.parameter || r.value === undefined || !r.period) continue;
    const p = r.parameter.toLowerCase().trim();
    const per = r.period.trim();
    const mine = r.mineName || r.subsidiary || 'General';

    if (!metrics[p]) metrics[p] = {};
    if (!metrics[p][per]) metrics[p][per] = [];
    metrics[p][per].push(r);

    if (!mineBreakdown[mine]) mineBreakdown[mine] = { production: 0, dispatch: 0, target: 0 };
    const num = parseNumeric(r.value) || 0;
    if (p.includes('prod')) mineBreakdown[mine].production += num;
    if (p.includes('disp')) mineBreakdown[mine].dispatch += num;
    if (p.includes('targ')) mineBreakdown[mine].target += num;
  }

  const anomalies = [];
  let summaryText = '=== DETERMINISTIC CALCULATIONS & HISTORICAL COMPARISONS ===\n\n';

  // Deterministic calculation: Period-over-period comparisons
  for (const [metricName, periodGroups] of Object.entries(metrics)) {
    const sortedPeriods = Object.keys(periodGroups).sort();
    if (sortedPeriods.length < 2) continue;

    for (let i = 1; i < sortedPeriods.length; i++) {
      const prevPeriod = sortedPeriods[i - 1];
      const currPeriod = sortedPeriods[i];

      const prevRecords = periodGroups[prevPeriod];
      const currRecords = periodGroups[currPeriod];

      const prevVal = prevRecords.reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
      const currVal = currRecords.reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
      const unit = currRecords[0].unit || prevRecords[0].unit || 'units';

      const pageNumbers = [...new Set(currRecords.map(r => r.pageNumber).filter(p => p != null))].join(', ');
      const pageStr = pageNumbers ? `Page(s) ${pageNumbers}` : 'Page N/A';

      if (prevVal === 0) continue;

      const absChange = currVal - prevVal;
      const pctChange = (absChange / prevVal) * 100;

      summaryText += `- Metric: ${metricName.toUpperCase()}\n`;
      summaryText += `  Period: ${prevPeriod} -> ${currPeriod}\n`;
      summaryText += `  Values: ${prevVal.toLocaleString()} -> ${currVal.toLocaleString()} ${unit}\n`;
      summaryText += `  Change: ${absChange >= 0 ? '+' : ''}${absChange.toFixed(2)} (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%)\n`;
      summaryText += `  Source Metadata: ${pageStr}\n\n`;

      // Anomaly detection
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

  // Deterministic calculation: Target vs Production variance
  const prodKey = Object.keys(metrics).find(k => k.includes('prod')) || 'production';
  const targetKey = Object.keys(metrics).find(k => k.includes('targ')) || 'target';
  const dispatchKey = Object.keys(metrics).find(k => k.includes('disp')) || 'dispatch';

  const prodGroup = metrics[prodKey] || {};
  const targetGroup = metrics[targetKey] || {};
  const dispatchGroup = metrics[dispatchKey] || {};

  summaryText += '=== DETERMINISTIC TARGET & DISPATCH METRICS ===\n\n';

  for (const p of Object.keys(prodGroup)) {
    const prodVal = prodGroup[p].reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0);
    const targetVal = targetGroup[p] ? targetGroup[p].reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0) : 0;
    const dispVal = dispatchGroup[p] ? dispatchGroup[p].reduce((sum, r) => sum + (parseNumeric(r.value) || 0), 0) : 0;
    const unit = prodGroup[p][0]?.unit || 'tonnes';

    const pageNumbers = [...new Set(prodGroup[p].map(r => r.pageNumber).filter(pg => pg != null))].join(', ');
    const pageStr = pageNumbers ? `Page(s) ${pageNumbers}` : 'Page N/A';

    summaryText += `Period: ${p}\n`;
    summaryText += `  Actual Production: ${prodVal.toLocaleString()} ${unit}\n`;

    if (targetVal > 0) {
      const variance = prodVal - targetVal;
      const pctVariance = (variance / targetVal) * 100;
      const achievementRate = (prodVal / targetVal) * 100;
      summaryText += `  Target: ${targetVal.toLocaleString()} ${unit}\n`;
      summaryText += `  Target Variance: ${variance >= 0 ? '+' : ''}${variance.toFixed(2)} (${pctVariance >= 0 ? '+' : ''}${pctVariance.toFixed(2)}%)\n`;
      summaryText += `  Target Achievement Rate: ${achievementRate.toFixed(1)}%\n`;

      if (pctVariance <= -10) {
        anomalies.push({
          metric: 'Production vs Target',
          currentValue: prodVal,
          comparisonValue: targetVal,
          change: variance,
          percentage: pctVariance,
          period: p,
          comparisonPeriod: 'Target',
          reason: `Production fell below target by ${Math.abs(pctVariance).toFixed(1)}%`,
          unit: unit,
          records: prodGroup[p]
        });
      }
    }

    if (dispVal > 0) {
      const gap = prodVal - dispVal;
      const dispatchRate = prodVal > 0 ? (dispVal / prodVal) * 100 : 0;
      summaryText += `  Actual Dispatch: ${dispVal.toLocaleString()} ${unit}\n`;
      summaryText += `  Production-Dispatch Gap: ${gap.toFixed(2)} ${unit} (Dispatch rate: ${dispatchRate.toFixed(1)}%)\n`;
    }

    summaryText += `  Source Metadata: ${pageStr}\n\n`;
  }

  // Deterministic calculation: Mine Volume Rankings
  const mineEntries = Object.entries(mineBreakdown).filter(([_, data]) => data.production > 0);
  if (mineEntries.length > 1) {
    mineEntries.sort((a, b) => b[1].production - a[1].production);
    summaryText += '=== DETERMINISTIC MINE RANKINGS BY PRODUCTION ===\n';
    mineEntries.forEach(([mine, data], idx) => {
      summaryText += `${idx + 1}. ${mine}: Production = ${data.production.toLocaleString()} | Dispatch = ${data.dispatch.toLocaleString()}\n`;
    });
    summaryText += '\n';
  }

  if (anomalies.length === 0) {
    summaryText += 'No significant negative operational anomalies detected.\n';
  }

  // 3. Evidence Retrieval for top anomalies (STRICTLY CAPPED TO TOP 2 TO PREVENT API LIMITS)
  let evidenceText = '=== RAG EVIDENCE FOR DETECTED ANOMALIES ===\n\n';
  let combinedSources = [];

  // Sort anomalies by magnitude and take at most the top 2
  const topAnomalies = anomalies
    .sort((a, b) => Math.abs(b.percentage || 0) - Math.abs(a.percentage || 0))
    .slice(0, 2);

  if (topAnomalies.length > 0) {
    for (const anom of topAnomalies) {
      evidenceText += `Anomaly: ${anom.reason} in ${anom.period}\n`;
      try {
        const query = `Why did ${anom.metric} vary in ${anom.period}? Equipment downtime, weather, maintenance, logistics, constraints.`;
        // Top 2 chunks per anomaly with safe timeout and embedding quota protection
        const similarChunks = await ragService.searchSimilar(query, 2, { reqContext });

        if (similarChunks && similarChunks.length > 0) {
          evidenceText += 'Retrieved Evidence:\n';
          similarChunks.forEach((chunk, i) => {
            const docName = chunk.documentId?.originalName || chunk.documentId?.title || chunk.documentId?.filename || 'Document';
            const cleanContent = (chunk.content || '').replace(/\s+/g, ' ').substring(0, 400);
            evidenceText += `[Evidence ${i + 1}] Source: ${docName}, Page: ${chunk.pageNumber || 'N/A'}\nExcerpt: ${cleanContent}\n\n`;
            combinedSources.push({
              documentId: chunk.documentId,
              pageNumber: chunk.pageNumber,
              similarity: chunk.similarityScore,
              reason: anom.reason,
              text: cleanContent
            });
          });
        } else {
          evidenceText += 'No supporting constraint documents found in available records.\n\n';
        }
      } catch (ragErr) {
        console.warn(`[Mining Intelligence] Evidence search skipped for anomaly (${anom.period}):`, ragErr.message);
        evidenceText += 'Supporting documentary evidence was omitted to preserve API context limits.\n\n';
      }
    }
  }

  // Ensure total output is safely bounded
  const boundedSummary = summaryText.length > 3500 ? summaryText.substring(0, 3500) + '\n[... deterministic metrics bounded]' : summaryText;
  const boundedEvidence = evidenceText.length > 2500 ? evidenceText.substring(0, 2500) + '\n[... anomaly evidence bounded]' : evidenceText;

  return {
    summaryText: boundedSummary,
    evidenceText: boundedEvidence,
    anomalies: topAnomalies,
    combinedSources
  };
};
