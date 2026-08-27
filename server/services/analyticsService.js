const ExtractedRecord = require('../models/ExtractedRecord');

const getProductionTrends = async () => {
  try {
    const records = await ExtractedRecord.find({ type: 'Production' }).sort({ date: 1 });
    return records;
  } catch (error) {
    throw new Error('Error fetching production trends: ' + error.message);
  }
};

const getAnomalies = async () => {
  try {
    // Dummy logic for anomalies: records > 3 std dev (simplified here for demonstration)
    // Normally, this would involve complex aggregation or machine learning logic
    const records = await ExtractedRecord.find({ type: 'Production' });
    if (records.length === 0) return [];
    
    // Extract numerical values to calculate mean and std dev (assuming a 'value' field exists in 'data' object)
    const values = records.map(r => r.data && r.data.amount ? Number(r.data.amount) : 0).filter(v => !isNaN(v));
    if (values.length === 0) return [];

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const anomalies = records.filter(r => {
      const val = r.data && r.data.amount ? Number(r.data.amount) : null;
      if (val === null) return false;
      return Math.abs(val - mean) > 3 * stdDev;
    });

    return anomalies;
  } catch (error) {
    throw new Error('Error fetching anomalies: ' + error.message);
  }
};

module.exports = {
  getProductionTrends,
  getAnomalies
};
