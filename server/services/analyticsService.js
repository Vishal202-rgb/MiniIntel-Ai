const ExtractedRecord = require('../models/ExtractedRecord');
const Document = require('../models/Document');
const ValidationResult = require('../models/ValidationResult');

const getAccessibleDocumentIds = async (user) => {
  if (user && user.role === 'admin') {
    return null; // Admin can see all, so return null to mean no filter
  }
  const docs = await Document.find(user ? { userId: user._id } : {}).select('_id');
  return docs.map(d => d._id);
};

const getProductionTrends = async (user) => {
  try {
    const docIds = await getAccessibleDocumentIds(user);
    const query = { parameter: /production/i };
    if (docIds) query.documentId = { $in: docIds };
    
    const records = await ExtractedRecord.find(query).sort({ period: 1 });
    return records;
  } catch (error) {
    throw new Error('Error fetching production trends: ' + error.message);
  }
};

const getAnomalies = async (user) => {
  try {
    const docIds = await getAccessibleDocumentIds(user);
    const query = { parameter: /production|dispatch/i };
    if (docIds) query.documentId = { $in: docIds };

    const records = await ExtractedRecord.find(query);
    if (records.length === 0) return [];
    
    const values = records.map(r => parseFloat(r.value)).filter(v => !isNaN(v));
    if (values.length === 0) return [];

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = records.filter(r => {
      const val = parseFloat(r.value);
      if (isNaN(val)) return false;
      return Math.abs(val - mean) > 3 * stdDev;
    });

    return anomalies;
  } catch (error) {
    throw new Error('Error fetching anomalies: ' + error.message);
  }
};

const getDashboardData = async (user) => {
  try {
    const docIds = await getAccessibleDocumentIds(user);
    
    const docQuery = docIds ? { _id: { $in: docIds } } : {};
    const totalDocuments = await Document.countDocuments(docQuery);
    
    const recordQuery = docIds ? { documentId: { $in: docIds } } : {};
    const openIssues = await ExtractedRecord.countDocuments({ ...recordQuery, status: 'pending' });
    
    const allRecords = await ExtractedRecord.find(recordQuery);
    
    // Group records by period
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
      const val = parseFloat(r.value) || 0;

      if (!periodsMap[period]) {
        periodsMap[period] = { year: period, production: 0, dispatch: 0, target: 0, gap: 0 };
      }

      if (p.includes('production')) {
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

    // Calculate avg validation/confidence score
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
  } catch (error) {
    throw new Error('Error fetching dashboard data: ' + error.message);
  }
};

module.exports = {
  getProductionTrends,
  getAnomalies,
  getDashboardData
};
