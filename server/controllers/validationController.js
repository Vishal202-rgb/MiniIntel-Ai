const validationService = require('../services/validationService');
const ValidationResult = require('../models/ValidationResult');

exports.validate = async (req, res) => {
  try {
    const { documentId } = req.params;

    console.log("VALIDATE API CALLED");
    console.log("DOCUMENT ID:", documentId);

    const results = await validationService.validateDocument(documentId);

    console.log("VALIDATION RESULTS:", results.length);

    res.status(200).json({
      message: 'Validation completed',
      count: results.length,
      results
    });
  } catch (error) {
    console.error("VALIDATION ERROR:", error);

    res.status(500).json({
      error: 'Failed to validate document',
      details: error.message
    });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { documentId } = req.params;
    const results = await ValidationResult.find({ documentId }).populate('documentId', 'filename title');
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch validation results', details: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { documentId } = req.query;
    const filter = documentId ? { documentId } : {};

    const results = await ValidationResult.find(filter)
      .populate('documentId', 'filename title')
      .sort({ createdAt: -1 });

    const summary = {
      totalIssues: results.length,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0
      },
      qualityScore: 100,
      issues: results
    };

    results.forEach(r => {
      if (summary.bySeverity[r.severity] !== undefined) {
        summary.bySeverity[r.severity]++;
      }
    });

    const penalty =
      (summary.bySeverity.critical * 5) +
      (summary.bySeverity.error * 3) +
      (summary.bySeverity.warning * 1);

    summary.qualityScore = Math.max(0, 100 - penalty);

    res.status(200).json(summary);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch validation summary',
      details: error.message
    });
  }
};

exports.resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, correctedValue, notes } = req.body;

    // Validate ID to prevent CastError (which causes 500)
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ error: 'Validation result not found (Invalid ID format)' });
    }

    const updateData = { 
      status: 'resolved', 
      resolvedAt: new Date() 
    };

    if (resolution !== undefined) updateData.resolution = resolution;
    if (correctedValue !== undefined) updateData.correctedValue = correctedValue;
    if (notes !== undefined) updateData.notes = notes;

    // Fallback: If legacy resolution is not provided but correctedValue/notes are, create a summary resolution
    if (resolution === undefined && (correctedValue || notes)) {
      updateData.resolution = `Corrected to: ${correctedValue || 'N/A'}. Notes: ${notes || 'None'}`;
    }

    const result = await ValidationResult.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!result) return res.status(404).json({ error: 'Validation result not found' });
    res.status(200).json(result);
  } catch (error) {
    // Return useful error without exposing stack traces
    res.status(400).json({ error: 'Failed to resolve issue', details: error.message });
  }
};
