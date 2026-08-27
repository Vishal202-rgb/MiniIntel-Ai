const validationService = require('../services/validationService');
const ValidationResult = require('../models/ValidationResult');

exports.validate = async (req, res) => {
  try {
    const { documentId } = req.params;
    const results = await validationService.validateDocument(documentId);
    res.status(200).json({ message: 'Validation completed', count: results.length, results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate document', details: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { documentId } = req.params;
    const results = await ValidationResult.find({ documentId });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch validation results', details: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { documentId } = req.query; // Expecting documentId as query param or global summary
    const filter = documentId ? { documentId } : {};

    const results = await ValidationResult.find(filter);
    
    const summary = {
      totalIssues: results.length,
      bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
      qualityScore: 100
    };

    results.forEach(r => {
      if (summary.bySeverity[r.severity] !== undefined) {
        summary.bySeverity[r.severity]++;
      }
    });

    // Simple quality score calculation
    const penalty = (summary.bySeverity.critical * 5) + (summary.bySeverity.error * 3) + (summary.bySeverity.warning * 1);
    summary.qualityScore = Math.max(0, 100 - penalty);

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch validation summary', details: error.message });
  }
};

exports.resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const result = await ValidationResult.findByIdAndUpdate(
      id,
      { status: 'resolved', resolution, resolvedAt: new Date() },
      { new: true }
    );

    if (!result) return res.status(404).json({ error: 'Validation result not found' });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve issue', details: error.message });
  }
};
