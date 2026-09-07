const ExtractedRecord = require('../models/ExtractedRecord');
const Document = require('../models/Document');
const ValidationResult = require('../models/ValidationResult');

function parseNumeric(val) {
  if (val === null || val === undefined) return null;
  const num = parseFloat(val.toString().replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

const getAccessibleDocumentIds = async (user) => {
  if (user && user.role === 'admin') {
    return null; // Admin can see all, so return null to mean no filter
  }
  const docs = await Document.find(user ? { userId: user._id } : {}).select('_id');
  return docs.map(d => d._id);
};

/**
 * Builds a unified Mongo query object honoring user RBAC tenancy and query filters.
 * Filters: mine, subsidiary, period, document, subject
 */
const buildRecordQuery = async (user, filters = {}) => {
  const query = {};

  // User tenancy
  const accessibleDocIds = await getAccessibleDocumentIds(user);
  if (accessibleDocIds) {
    query.documentId = { $in: accessibleDocIds };
  }

  // Document filter
  if (filters.document) {
    query.documentId = filters.document;
  }

  // Mine filter
  if (filters.mine) {
    query.mineName = { $regex: new RegExp(filters.mine.trim(), 'i') };
  }

  // Subsidiary filter
  if (filters.subsidiary) {
    query.subsidiary = { $regex: new RegExp(filters.subsidiary.trim(), 'i') };
  }

  // Period filter
  if (filters.period) {
    query.period = { $regex: new RegExp(filters.period.trim(), 'i') };
  }

  // Subject / Parameter filter
  if (filters.subject) {
    query.parameter = { $regex: new RegExp(filters.subject.trim(), 'i') };
  }

  return query;
};

/**
 * REST v1: GET /api/v1/analytics/overview
 */
const getOverview = async (user, filters = {}) => {
  const query = await buildRecordQuery(user, filters);
  
  // Total accessible documents
  const docQuery = {};
  if (user && user.role !== 'admin') {
    docQuery.userId = user._id;
  }
  if (filters.document) {
    docQuery._id = filters.document;
  }
  const totalDocuments = await Document.countDocuments(docQuery);

  const records = await ExtractedRecord.find(query).populate('documentId', 'originalName filename mineName subsidiary');
  const totalRecords = records.length;

  let totalProduction = 0;
  let totalDispatch = 0;
  let totalTarget = 0;
  const periodsMap = {};
  let openIssues = 0;
  let totalConfidence = 0;
  let confCount = 0;

  for (const r of records) {
    if (r.status === 'pending') openIssues++;
    if (r.confidenceScore != null) {
      totalConfidence += r.confidenceScore;
      confCount++;
    }

    const p = (r.parameter || '').toLowerCase();
    const period = (r.period || 'Unspecified').trim();
    const val = parseNumeric(r.value) || 0;

    if (!periodsMap[period]) {
      periodsMap[period] = { period, production: 0, dispatch: 0, target: 0, gap: 0, unit: r.unit || 'MT' };
    }

    if (p.includes('production') && !p.includes('target') && !p.includes('decrease') && !p.includes('gap')) {
      periodsMap[period].production += val;
      totalProduction += val;
    } else if (p.includes('dispatch')) {
      periodsMap[period].dispatch += val;
      totalDispatch += val;
    } else if (p.includes('target') && !p.includes('achievement') && !p.includes('variance')) {
      periodsMap[period].target += val;
      totalTarget += val;
    }
  }

  const periodBreakdown = Object.values(periodsMap).map(p => {
    p.gap = Math.max(0, Number((p.production - p.dispatch).toFixed(2)));
    p.production = Number(p.production.toFixed(2));
    p.dispatch = Number(p.dispatch.toFixed(2));
    p.target = Number(p.target.toFixed(2));
    return p;
  }).sort((a, b) => a.period.localeCompare(b.period));

  const avgConfidence = confCount > 0 ? Number(((totalConfidence / confCount) * 100).toFixed(1)) : 0;
  const achievementRate = totalTarget > 0 ? Number(((totalProduction / totalTarget) * 100).toFixed(2)) : 0;

  return {
    totalDocuments,
    totalRecords,
    totalProduction: Number(totalProduction.toFixed(2)),
    totalDispatch: Number(totalDispatch.toFixed(2)),
    totalTarget: Number(totalTarget.toFixed(2)),
    productionDispatchGap: Math.max(0, Number((totalProduction - totalDispatch).toFixed(2))),
    achievementRate,
    averageValidationScore: `${avgConfidence}%`,
    openIssues,
    periods: periodBreakdown,
    filtersApplied: filters
  };
};

/**
 * REST v1: GET /api/v1/analytics/kpis
 */
const getKPIs = async (user, filters = {}) => {
  const overview = await getOverview(user, filters);
  return {
    totalDocuments: overview.totalDocuments,
    totalRecords: overview.totalRecords,
    totalProduction: `${overview.totalProduction} MT`,
    totalDispatch: `${overview.totalDispatch} MT`,
    totalTarget: `${overview.totalTarget} MT`,
    productionDispatchGap: `${overview.productionDispatchGap} MT`,
    achievementRate: `${overview.achievementRate}%`,
    averageValidationScore: overview.averageValidationScore,
    openIssues: overview.openIssues
  };
};

/**
 * REST v1: GET /api/v1/analytics/production
 */
const getProductionMetrics = async (user, filters = {}) => {
  const query = await buildRecordQuery(user, filters);
  query.parameter = /production/i;

  const records = await ExtractedRecord.find(query).populate('documentId', 'originalName filename mineName subsidiary');

  const periodMap = {};
  const mineMap = {};
  let totalProduction = 0;

  for (const r of records) {
    const p = (r.parameter || '').toLowerCase();
    if (p.includes('target') || p.includes('decrease') || p.includes('gap')) continue;

    const val = parseNumeric(r.value);
    if (val === null) continue;

    totalProduction += val;
    const period = (r.period || 'General').trim();
    const mine = r.mineName || r.documentId?.mineName || 'Default Mine';

    // Group by period
    if (!periodMap[period]) periodMap[period] = { period, total: 0, recordsCount: 0, unit: r.unit || 'MT' };
    periodMap[period].total += val;
    periodMap[period].recordsCount++;

    // Group by mine
    if (!mineMap[mine]) mineMap[mine] = { mine, total: 0, recordsCount: 0, unit: r.unit || 'MT' };
    mineMap[mine].total += val;
    mineMap[mine].recordsCount++;
  }

  const byPeriod = Object.values(periodMap).map(p => ({
    period: p.period,
    production: Number(p.total.toFixed(2)),
    recordsCount: p.recordsCount,
    unit: p.unit
  })).sort((a, b) => a.period.localeCompare(b.period));

  const byMine = Object.values(mineMap).map(m => ({
    mine: m.mine,
    production: Number(m.total.toFixed(2)),
    recordsCount: m.recordsCount,
    unit: m.unit
  }));

  return {
    totalProduction: Number(totalProduction.toFixed(2)),
    unit: byPeriod[0]?.unit || 'MT',
    byPeriod,
    byMine,
    totalRecords: records.length
  };
};

/**
 * REST v1: GET /api/v1/analytics/dispatch
 */
const getDispatchMetrics = async (user, filters = {}) => {
  const query = await buildRecordQuery(user, filters);
  query.parameter = /dispatch/i;

  const records = await ExtractedRecord.find(query).populate('documentId', 'originalName filename mineName subsidiary');

  const periodMap = {};
  const mineMap = {};
  let totalDispatch = 0;

  for (const r of records) {
    const val = parseNumeric(r.value);
    if (val === null) continue;

    totalDispatch += val;
    const period = (r.period || 'General').trim();
    const mine = r.mineName || r.documentId?.mineName || 'Default Mine';

    if (!periodMap[period]) periodMap[period] = { period, total: 0, recordsCount: 0, unit: r.unit || 'MT' };
    periodMap[period].total += val;
    periodMap[period].recordsCount++;

    if (!mineMap[mine]) mineMap[mine] = { mine, total: 0, recordsCount: 0, unit: r.unit || 'MT' };
    mineMap[mine].total += val;
    mineMap[mine].recordsCount++;
  }

  const byPeriod = Object.values(periodMap).map(p => ({
    period: p.period,
    dispatch: Number(p.total.toFixed(2)),
    recordsCount: p.recordsCount,
    unit: p.unit
  })).sort((a, b) => a.period.localeCompare(b.period));

  const byMine = Object.values(mineMap).map(m => ({
    mine: m.mine,
    dispatch: Number(m.total.toFixed(2)),
    recordsCount: m.recordsCount,
    unit: m.unit
  }));

  return {
    totalDispatch: Number(totalDispatch.toFixed(2)),
    unit: byPeriod[0]?.unit || 'MT',
    byPeriod,
    byMine,
    totalRecords: records.length
  };
};

/**
 * REST v1 & Legacy: GET /api/v1/analytics/trends
 */
const getProductionTrends = async (user, filters = {}) => {
  const query = await buildRecordQuery(user, filters);
  query.parameter = /production/i;

  const records = await ExtractedRecord.find(query)
    .populate('documentId', 'originalName filename mineName subsidiary')
    .sort({ period: 1 });

  // Compute period-over-period trends
  const periodsMap = {};
  for (const r of records) {
    const p = (r.parameter || '').toLowerCase();
    if (p.includes('target') || p.includes('decrease')) continue;
    const val = parseNumeric(r.value);
    if (val === null) continue;
    const period = (r.period || 'General').trim();
    if (!periodsMap[period]) periodsMap[period] = { period, production: 0, unit: r.unit || 'MT' };
    periodsMap[period].production += val;
  }

  const sortedPeriods = Object.values(periodsMap).sort((a, b) => a.period.localeCompare(b.period));
  const trends = [];

  for (let i = 0; i < sortedPeriods.length; i++) {
    const curr = sortedPeriods[i];
    let change = 0;
    let percentageChange = 0;

    if (i > 0) {
      const prev = sortedPeriods[i - 1];
      change = Number((curr.production - prev.production).toFixed(2));
      percentageChange = prev.production > 0 
        ? Number(((change / prev.production) * 100).toFixed(2)) 
        : 0;
    }

    trends.push({
      period: curr.period,
      production: Number(curr.production.toFixed(2)),
      unit: curr.unit,
      change,
      percentageChange,
      trajectory: change >= 0 ? (change === 0 ? 'STABLE' : 'INCREASING') : 'DECREASING'
    });
  }

  return {
    records,
    trends
  };
};

/**
 * REST v1: GET /api/v1/analytics/variance
 */
const getVarianceAnalysis = async (user, filters = {}) => {
  const overview = await getOverview(user, filters);
  const varianceList = [];

  for (const p of overview.periods) {
    const target = p.target;
    const actual = p.production;
    const dispatch = p.dispatch;

    const targetVariance = target > 0 ? Number((actual - target).toFixed(2)) : 0;
    const achievementRate = target > 0 ? Number(((actual / target) * 100).toFixed(2)) : 0;
    const dispatchGap = Math.max(0, Number((actual - dispatch).toFixed(2)));

    varianceList.push({
      period: p.period,
      actualProduction: actual,
      targetProduction: target,
      variance: targetVariance,
      achievementRate,
      dispatch,
      dispatchGap,
      unit: p.unit || 'MT',
      status: target > 0 
        ? (achievementRate >= 100 ? 'TARGET_EXCEEDED' : (achievementRate >= 75 ? 'ON_TRACK' : 'CRITICAL_SHORTFALL')) 
        : 'NO_TARGET'
    });
  }

  return {
    periods: varianceList,
    totalProduction: overview.totalProduction,
    totalTarget: overview.totalTarget,
    netVariance: Number((overview.totalProduction - overview.totalTarget).toFixed(2)),
    overallAchievementRate: overview.achievementRate
  };
};

/**
 * REST v1 & Legacy: GET /api/v1/analytics/anomalies
 */
const getAnomalies = async (user, filters = {}) => {
  const query = await buildRecordQuery(user, filters);
  query.parameter = /production|dispatch/i;

  const records = await ExtractedRecord.find(query).populate('documentId', 'originalName filename mineName subsidiary');
  if (records.length === 0) return [];

  const values = records.map(r => parseNumeric(r.value)).filter(v => v !== null);
  if (values.length === 0) return [];

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // 1. Statistical Outliers
  const anomalies = [];
  records.forEach(r => {
    const val = parseNumeric(r.value);
    if (val === null) return;
    if (stdDev > 0 && Math.abs(val - mean) > 2.0 * stdDev) {
      anomalies.push({
        type: 'STATISTICAL_OUTLIER',
        recordId: r._id,
        documentName: r.documentId?.originalName || 'Document',
        parameter: r.parameter,
        value: val,
        unit: r.unit,
        period: r.period,
        mean: Number(mean.toFixed(2)),
        deviation: Number((val - mean).toFixed(2)),
        zScore: Number(((val - mean) / stdDev).toFixed(2)),
        reason: `Value ${val} deviates significantly from mean ${mean.toFixed(1)} (Z-score: ${((val - mean) / stdDev).toFixed(1)})`
      });
    }
  });

  // 2. Period-over-Period Decreases (> 10% drops)
  const trendsRes = await getProductionTrends(user, filters);
  trendsRes.trends.forEach(t => {
    if (t.percentageChange <= -10) {
      anomalies.push({
        type: 'PERIOD_DROP_ANOMALY',
        period: t.period,
        parameter: 'Production',
        value: t.production,
        unit: t.unit,
        change: t.change,
        percentageChange: t.percentageChange,
        reason: `Production decreased by ${Math.abs(t.percentageChange)}% in ${t.period}`
      });
    }
  });

  return anomalies;
};

/**
 * Legacy Dashboard Data (Preserved for React UI AnalyticsDashboard.jsx)
 */
const getDashboardData = async (user) => {
  const docIds = await getAccessibleDocumentIds(user);
  const docQuery = docIds ? { _id: { $in: docIds } } : {};
  const totalDocuments = await Document.countDocuments(docQuery);
  
  const recordQuery = docIds ? { documentId: { $in: docIds } } : {};
  const openIssues = await ExtractedRecord.countDocuments({ ...recordQuery, status: 'pending' });
  
  const allRecords = await ExtractedRecord.find(recordQuery);
  const periodsMap = {};
  let globalProd = 0;
  let globalDispatch = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const r of allRecords) {
    if (r.confidenceScore !== undefined && r.confidenceScore !== null) {
      totalConfidence += r.confidenceScore;
      confidenceCount++;
    }

    if (!r.period || r.period.trim() === '') continue;
    const period = r.period.trim();
    const p = r.parameter ? r.parameter.toLowerCase() : '';
    const val = parseNumeric(r.value) || 0;

    if (!periodsMap[period]) {
      periodsMap[period] = { year: period, production: 0, dispatch: 0, target: 0, gap: 0 };
    }

    if (p.includes('production') && !p.includes('target') && !p.includes('decrease')) {
      periodsMap[period].production += val;
      globalProd += val;
    } else if (p.includes('dispatch')) {
      periodsMap[period].dispatch += val;
      globalDispatch += val;
    } else if (p.includes('target')) {
      periodsMap[period].target += val;
    }
  }

  const productionData = Object.values(periodsMap).map(p => {
    p.gap = Math.max(0, p.production - p.dispatch);
    return p;
  }).sort((a, b) => a.year.localeCompare(b.year));

  const avgScore = confidenceCount > 0 ? (totalConfidence / confidenceCount * 100).toFixed(1) + '%' : 'N/A';

  const kpis = {
    totalDocuments: totalDocuments,
    totalProduction: globalProd > 0 ? `${globalProd.toFixed(1)} MT` : '0 MT',
    totalDispatch: globalDispatch > 0 ? `${globalDispatch.toFixed(1)} MT` : '0 MT',
    averageValidationScore: avgScore,
    openIssues: openIssues
  };

  let insights = [];
  if (productionData.length > 1) {
    const first = productionData[0].production;
    const last = productionData[productionData.length - 1].production;
    if (first > 0 && last > first) {
      const growth = (((last - first) / first) * 100).toFixed(1);
      insights.push(`Upward trend in production, with a ${growth}% growth from ${productionData[0].year} to ${productionData[productionData.length - 1].year}.`);
    } else if (first > 0 && last < first) {
      const decline = (((first - last) / first) * 100).toFixed(1);
      insights.push(`Downward trend in production, with a ${decline}% decrease from ${productionData[0].year} to ${productionData[productionData.length - 1].year}.`);
    }
    
    const lastGap = productionData[productionData.length - 1].gap;
    if (lastGap > 0) {
      insights.push(`The Production-Dispatch gap currently stands at ${lastGap.toFixed(1)} MT for the latest period (${productionData[productionData.length - 1].year}).`);
    }
  } else if (productionData.length === 1) {
     insights.push(`Data collected for ${productionData[0].year} indicates ${productionData[0].production} MT production.`);
  } else {
     insights.push('Insufficient data to generate meaningful insights. Upload and extract more production documents.');
  }

  return { kpis, productionData, insights };
};

module.exports = {
  // REST v1
  getOverview,
  getKPIs,
  getProductionMetrics,
  getDispatchMetrics,
  getVarianceAnalysis,
  getProductionTrends,
  getAnomalies,
  // Legacy
  getDashboardData
};
