const ExtractedRecord = require('../models/ExtractedRecord');
const Document = require('../models/Document');
const DocumentPage = require('../models/DocumentPage');
const llmService = require('./llmService');

exports.extractFromDocument = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const pages = await DocumentPage.find({ documentId }).sort({ pageNumber: 1 });
    if (!pages || pages.length === 0) {
      throw new Error('No pages found for this document');
    }

    const systemPrompt = `You are a data extraction AI. Extract the following parameters from the text: mine, subsidiary, location, year, production, dispatch, target, achievement, overburden. Return a JSON object with a 'records' array. Each record should contain: parameter, value, unit, period, mineName, subsidiary, confidenceScore (0-1), and sourceText.`;

    const extractedRecords = [];

    for (const page of pages) {
      if (!page.content) continue;

      const userPrompt = `Extract data from the following text:\n\n${page.content}`;
      
      const response = await llmService.callLLM(systemPrompt, userPrompt);
      
      if (response && response.records && Array.isArray(response.records)) {
        for (const record of response.records) {
          const extractedRecord = new ExtractedRecord({
            documentId,
            pageNumber: page.pageNumber,
            parameter: record.parameter,
            value: record.value,
            originalValue: record.value,
            unit: record.unit,
            period: record.period,
            mineName: record.mineName,
            subsidiary: record.subsidiary,
            confidenceScore: record.confidenceScore,
            sourceText: record.sourceText,
            status: 'pending'
          });
          
          await extractedRecord.save();
          extractedRecords.push(extractedRecord);
        }
      }
    }

    // Update document status if needed
    document.status = 'extracted';
    await document.save();

    return extractedRecords;
  } catch (error) {
    console.error('Error during extraction:', error);
    throw error;
  }
};
