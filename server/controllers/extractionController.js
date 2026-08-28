const extractionService = require('../services/extractionService');
const ExtractedRecord = require('../models/ExtractedRecord');

exports.extract = async (req, res) => {
  try {
    const { documentId } = req.params;

    console.log('====================================');
    console.log('EXTRACTION STARTED');
    console.log('Document ID:', documentId);
    console.log('====================================');

    const records = await extractionService.extractFromDocument(documentId);

    console.log('EXTRACTION COMPLETED');
    console.log('Records created:', records.length);

    res.status(200).json({
      message: 'Extraction completed',
      count: records.length,
      records
    });

  } catch (error) {
    console.error('EXTRACTION ERROR:', error);

    res.status(500).json({
      error: 'Failed to extract data',
      details: error.message
    });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const { documentId } = req.params;

    const records = await ExtractedRecord.find({ documentId })
      .sort({ pageNumber: 1, createdAt: 1 });

    res.status(200).json(records);

  } catch (error) {
    console.error('GET RECORDS ERROR:', error);

    res.status(500).json({
      error: 'Failed to fetch records',
      details: error.message
    });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, unit } = req.body;

    const record = await ExtractedRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        error: 'Record not found'
      });
    }

    if (value !== undefined && value !== record.value) {
      record.editHistory.push({
        field: 'value',
        oldValue: record.value,
        newValue: value
      });

      record.value = value;
    }

    if (unit !== undefined && unit !== record.unit) {
      record.editHistory.push({
        field: 'unit',
        oldValue: record.unit,
        newValue: unit
      });

      record.unit = unit;
    }

    await record.save();

    res.status(200).json(record);

  } catch (error) {
    console.error('UPDATE RECORD ERROR:', error);

    res.status(500).json({
      error: 'Failed to update record',
      details: error.message
    });
  }
};

exports.approveRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ExtractedRecord.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        reviewedAt: new Date()
      },
      {
        new: true
      }
    );

    if (!record) {
      return res.status(404).json({
        error: 'Record not found'
      });
    }

    res.status(200).json(record);

  } catch (error) {
    console.error('APPROVE RECORD ERROR:', error);

    res.status(500).json({
      error: 'Failed to approve record',
      details: error.message
    });
  }
};

exports.rejectRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await ExtractedRecord.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        reviewedAt: new Date()
      },
      {
        new: true
      }
    );

    if (!record) {
      return res.status(404).json({
        error: 'Record not found'
      });
    }

    res.status(200).json(record);

  } catch (error) {
    console.error('REJECT RECORD ERROR:', error);

    res.status(500).json({
      error: 'Failed to reject record',
      details: error.message
    });
  }
};

exports.bulkApprove = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Invalid or empty IDs array'
      });
    }

    await ExtractedRecord.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      {
        $set: {
          status: 'approved',
          reviewedAt: new Date()
        }
      }
    );

    res.status(200).json({
      message: 'Records approved successfully'
    });

  } catch (error) {
    console.error('BULK APPROVE ERROR:', error);

    res.status(500).json({
      error: 'Failed to bulk approve records',
      details: error.message
    });
  }
};