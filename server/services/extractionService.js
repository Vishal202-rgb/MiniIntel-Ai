const ExtractedRecord = require('../models/ExtractedRecord');
const Document = require('../models/Document');
const DocumentPage = require('../models/DocumentPage');
const llmService = require('./llmService');

const normalizeResponse = (response) => {
  if (!response) {
    return null;
  }

  // Already an object
  if (typeof response === 'object') {
    return response;
  }

  // JSON returned as string
  if (typeof response === 'string') {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Could not parse LLM response as JSON');

      // Try extracting JSON from markdown/code fences
      const match = response.match(/\{[\s\S]*\}/);

      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (err) {
          console.error('Could not parse extracted JSON');
        }
      }

      return null;
    }
  }

  return null;
};

const cleanValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return value.toString().trim();
};

exports.extractFromDocument = async (documentId) => {
  try {
    console.log('====================================');
    console.log('EXTRACTION SERVICE STARTED');
    console.log('Document ID:', documentId);
    console.log('====================================');

    // --------------------------------------------------
    // 1. Find document
    // --------------------------------------------------

    const document = await Document.findById(documentId);

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    console.log('Document found:', document.filename || document.title || document._id);

    // --------------------------------------------------
    // 2. Find document pages
    // --------------------------------------------------

    const pages = await DocumentPage.find({
      documentId
    }).sort({
      pageNumber: 1
    });

    console.log('Pages found:', pages.length);

    if (!pages || pages.length === 0) {
      throw new Error(
        'No pages found for this document. PDF text extraction may not have created DocumentPage records.'
      );
    }

    // --------------------------------------------------
    // 3. Check page content
    // --------------------------------------------------

    const pagesWithContent = pages.filter(
      page => page.content && page.content.toString().trim().length > 0
    );

    console.log(
      'Pages containing text:',
      pagesWithContent.length,
      '/',
      pages.length
    );

    if (pagesWithContent.length === 0) {
      throw new Error(
        'Document pages exist but contain no text. PDF text extraction/OCR needs to be checked.'
      );
    }

    // --------------------------------------------------
    // 4. Prevent duplicate extraction
    // --------------------------------------------------

    const existingRecords = await ExtractedRecord.countDocuments({
      documentId
    });

    if (existingRecords > 0) {
      console.log(
        `Existing extracted records found: ${existingRecords}`
      );

      console.log(
        'Deleting old extracted records before re-extraction...'
      );

      await ExtractedRecord.deleteMany({
        documentId
      });
    }

    // --------------------------------------------------
    // 5. LLM prompt
    // --------------------------------------------------

    const systemPrompt = `
You are a highly accurate mining-report data extraction AI.

Extract structured data from the supplied mining report text.

Look for parameters such as:
- mine
- subsidiary
- location
- year
- production
- dispatch
- target
- achievement
- overburden
- operating cost
- quantity
- other important measurable mining parameters

CRITICAL - TABULAR DATA:
You must carefully extract all data from tables. Look for aligned text, rows, and columns. Ensure you capture the correct parent category (e.g. column headers) and apply it to each extracted row value.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "records": [
    {
      "parameter": "Production",
      "value": "10.2",
      "unit": "MT",
      "period": "FY 2021",
      "mineName": "Jayant Mine",
      "subsidiary": "NCL",
      "confidenceScore": 0.95,
      "sourceText": "original text containing this value exactly as it appears in the source"
    }
  ]
}

Rules:
1. Every useful numerical/measurable parameter should become a separate record.
2. Do not invent values.
3. Preserve the original value as closely as possible.
4. If unit is missing, return an empty string.
5. If period is missing, return an empty string.
6. If mine name is missing, return an empty string.
7. confidenceScore must be between 0 and 1. Calculate carefully based on text ambiguity.
8. sourceText MUST contain the exact surrounding phrase or row where the value was found to ensure provenance.
9. Return an empty records array if nothing useful is found.
`;

    const extractedRecords = [];

    // --------------------------------------------------
    // 6. Process every page
    // --------------------------------------------------

    for (const page of pagesWithContent) {
      console.log('------------------------------------');
      console.log('Processing page:', page.pageNumber);

      const pageContent = page.content.toString().trim();

      console.log(
        'Page content length:',
        pageContent.length
      );

      const userPrompt = `
Extract all relevant mining data from this page.

PAGE NUMBER:
${page.pageNumber}

PAGE TEXT:
${pageContent}
`;

      // --------------------------------------------------
      // 7. Call LLM
      // --------------------------------------------------
      let response;

      try {
        response = await llmService.callLLM(systemPrompt, userPrompt, { format: 'json' });
      } catch (llmError) {
        console.error(`LLM error on page ${page.pageNumber}:`, llmError.message);
        throw new Error(`Failed to extract data via AI for page ${page.pageNumber}. Error: ${llmError.message}`);
      }

      console.log('Raw LLM response:', typeof response === 'object' ? JSON.stringify(response, null, 2) : response);

      // --------------------------------------------------
      // 8. Normalize LLM response
      // --------------------------------------------------
      const normalizedResponse = normalizeResponse(response);

      if (!normalizedResponse) {
        throw new Error(`Failed to parse AI response for page ${page.pageNumber}. Invalid format.`);
      }

      // Check if llmService gracefully fell back to action='rag' due to JSON parsing failure
      if (normalizedResponse.action === 'rag' && normalizedResponse.error) {
         throw new Error(`AI generated an invalid JSON format for page ${page.pageNumber}. Raw output: ${normalizedResponse.message}`);
      }

      let records = normalizedResponse.records || normalizedResponse.data || normalizedResponse.extractedData;

      // Sometimes model may return an array directly
      if (Array.isArray(normalizedResponse)) {
        records = normalizedResponse;
      } else if (!records && typeof normalizedResponse === 'object') {
        // find first array in the object
        for (const key in normalizedResponse) {
          if (Array.isArray(normalizedResponse[key])) {
            records = normalizedResponse[key];
            break;
          }
        }
      }

      if (!Array.isArray(records)) {
        console.log(`No records array returned for page ${page.pageNumber}`);
        console.log('Normalized response:', JSON.stringify(normalizedResponse));
        throw new Error(`AI did not return a valid records array for page ${page.pageNumber}. Instead returned: ${JSON.stringify(normalizedResponse)}`);
      }

      console.log(`Parsed LLM records count for page ${page.pageNumber}:`, records.length);

      // --------------------------------------------------
      // 9. Save records
      // --------------------------------------------------

      for (const record of records) {
        if (!record || typeof record !== 'object') {
          continue;
        }

        const parameter = cleanValue(record.parameter || record.metric || record.name || record.key);
        const value = cleanValue(record.value || record.amount || record.quantity || record.val);
        const unit = cleanValue(record.unit || record.uom);
        const period = cleanValue(record.period || record.year || record.fiscal_year || record.time);
        const mineName = cleanValue(record.mineName || record.mine);
        const subsidiary = cleanValue(record.subsidiary || record.company);
        
        let confidence = Number(record.confidenceScore || record.confidence);

        if (Number.isNaN(confidence)) {
          confidence = 0.75;
        }

        confidence = Math.max(0, Math.min(1, confidence));

        // parameter is required by schema
        if (!parameter) {
          console.log('Skipping record because parameter is missing');
          continue;
        }

        const extractedRecord = new ExtractedRecord({
          documentId,
          pageNumber: page.pageNumber,
          parameter,
          value,
          originalValue: value,
          unit,
          period,
          mineName,
          subsidiary,
          confidenceScore: confidence,
          sourceText: cleanValue(record.sourceText) || pageContent,
          status: 'pending'
        });

        await extractedRecord.save();

        extractedRecords.push(extractedRecord);

        console.log(
          'Saved extracted record:',
          parameter,
          '| value:',
          record.value,
          '| unit:',
          record.unit
        );
      }
    }

    // --------------------------------------------------
    // 10. Update document status
    // --------------------------------------------------

    document.status = 'extracted';
    await document.save();

    // --------------------------------------------------
    // 11. Final logs
    // --------------------------------------------------
    console.log('====================================');
    console.log('EXTRACTION FINISHED');
    console.log('Document ID:', documentId);
    console.log('extractedRecords.length:', extractedRecords.length);
    console.log('saved record IDs:', extractedRecords.map(r => r._id));
    console.log('====================================');

    if (extractedRecords.length === 0) {
      throw new Error(`The AI processed ${pagesWithContent.length} page(s) but could not find any measurable mining data to extract.`);
    }

    return extractedRecords;

  } catch (error) {
    console.error('====================================');
    console.error('EXTRACTION SERVICE ERROR');
    console.error(error);
    console.error('====================================');

    throw error;
  }
};