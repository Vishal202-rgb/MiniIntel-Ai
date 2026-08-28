const ValidationResult = require('../models/ValidationResult');
const ExtractedRecord = require('../models/ExtractedRecord');

const normalizeStr = (value) =>
  (value ?? '').toString().trim().toLowerCase();

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return NaN;
  }

  const cleaned = value
    .toString()
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '');

  return parseFloat(cleaned);
};

const isProduction = (parameter) => {
  const value = normalizeStr(parameter);

  return (
    value.includes('production') &&
    !value.includes('target') &&
    !value.includes('dispatch')
  );
};

const isDispatch = (parameter) => {
  const value = normalizeStr(parameter);
  return value.includes('dispatch');
};

const isTarget = (parameter) => {
  const value = normalizeStr(parameter);
  return value.includes('target');
};

const isMonitoredParameter = (parameter) => {
  return /(production|dispatch|target|cost|quantity)/i.test(
    normalizeStr(parameter)
  );
};

/**
 * Create validation issue only if the same OPEN issue
 * doesn't already exist.
 */
const createIssueIfNotExists = async (
  issueData,
  newValidationResults
) => {
  const existing = await ValidationResult.findOne({
    documentId: issueData.documentId,
    recordId: issueData.recordId,
    type: issueData.type,
    field: issueData.field,
    status: 'open'
  });

  if (existing) {
    return existing;
  }

  const result = await ValidationResult.create(issueData);

  newValidationResults.push(result);

  return result;
};

exports.validateDocument = async (documentId) => {
  try {
    console.log('\n====================================');
    console.log('VALIDATION STARTED');
    console.log('Document ID:', documentId);
    console.log('====================================');

    // --------------------------------------------------
    // 1. Get extracted records
    // --------------------------------------------------

    const records = await ExtractedRecord.find({
      documentId
    }).sort({
      pageNumber: 1,
      createdAt: 1
    });

    console.log('Extracted records found:', records.length);

    const newValidationResults = [];

    if (!records.length) {
      console.log(
        'No extracted records found for document:',
        documentId
      );

      return [];
    }

    // --------------------------------------------------
    // 2. Calculate parameter statistics
    // --------------------------------------------------

    const paramStats = {};

    for (const record of records) {
      const number = parseNumber(record.value);

      if (isNaN(number)) {
        continue;
      }

      const parameter = normalizeStr(record.parameter);

      if (!parameter) {
        continue;
      }

      if (!paramStats[parameter]) {
        paramStats[parameter] = [];
      }

      paramStats[parameter].push(number);
    }

    const paramAverages = {};

    for (const [parameter, values] of Object.entries(
      paramStats
    )) {
      if (values.length === 0) {
        continue;
      }

      const total = values.reduce(
        (sum, value) => sum + value,
        0
      );

      paramAverages[parameter] = total / values.length;
    }

    // --------------------------------------------------
    // 3. Group records
    // --------------------------------------------------

    const groupedRecords = {};

    for (const record of records) {
      const key = [
        normalizeStr(record.period),
        normalizeStr(record.mineName),
        normalizeStr(record.subsidiary)
      ].join('_');

      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }

      groupedRecords[key].push(record);
    }

    // --------------------------------------------------
    // 4. Individual record validation
    // --------------------------------------------------

    for (const record of records) {
      const documentId = record.documentId;
      const recordId = record._id;

      const parameter = record.parameter || 'Unknown Parameter';
      const value = record.value;
      const unit = record.unit;

      const number = parseNumber(value);

      console.log('Checking:', {
        parameter,
        value,
        unit,
        confidenceScore: record.confidenceScore
      });

      // ------------------------------------------------
      // Rule 1: Missing value
      // ------------------------------------------------

      if (
        value === undefined ||
        value === null ||
        value.toString().trim() === ''
      ) {
        await createIssueIfNotExists(
          {
            documentId,
            recordId,
            type: 'missing_data',
            severity: 'warning',
            field: 'value',
            message: `Missing value for parameter "${parameter}".`,
            status: 'open'
          },
          newValidationResults
        );
      }

      // ------------------------------------------------
      // Rule 2: Missing unit
      // ------------------------------------------------

      if (
        unit === undefined ||
        unit === null ||
        unit.toString().trim() === ''
      ) {
        await createIssueIfNotExists(
          {
            documentId,
            recordId,
            type: 'missing_data',
            severity: 'warning',
            field: 'unit',
            message: `Missing unit for parameter "${parameter}".`,
            status: 'open'
          },
          newValidationResults
        );
      }

      // ------------------------------------------------
      // Rule 3: Negative numeric value
      // ------------------------------------------------

      if (
        isMonitoredParameter(parameter) &&
        !isNaN(number) &&
        number < 0
      ) {
        await createIssueIfNotExists(
          {
            documentId,
            recordId,
            type: 'invalid_value',
            severity: 'error',
            field: 'value',
            message: `Numeric value for "${parameter}" cannot be negative: ${value}.`,
            status: 'open'
          },
          newValidationResults
        );
      }

      // ------------------------------------------------
      // Rule 4: Low extraction confidence
      // ------------------------------------------------

      if (
        record.confidenceScore !== undefined &&
        record.confidenceScore !== null &&
        record.confidenceScore < 0.70
      ) {
        await createIssueIfNotExists(
          {
            documentId,
            recordId,
            type: 'suspicious_value',
            severity: 'warning',
            field: 'confidenceScore',
            message: `Low extraction confidence (${(
              record.confidenceScore * 100
            ).toFixed(1)}%) for "${parameter}".`,
            status: 'open'
          },
          newValidationResults
        );
      }

      // ------------------------------------------------
      // Rule 5: Suspiciously high value
      // ------------------------------------------------

      if (!isNaN(number) && number > 0) {
        const normalizedParameter =
          normalizeStr(parameter);

        const values =
          paramStats[normalizedParameter] || [];

        const average =
          paramAverages[normalizedParameter];

        /*
         * Only compare when there are at least
         * 2 values for the same parameter.
         */
        if (
          average &&
          values.length >= 2 &&
          number > average * 5
        ) {
          await createIssueIfNotExists(
            {
              documentId,
              recordId,
              type: 'suspicious_value',
              severity: 'warning',
              field: 'value',
              message: `Unusually high value for "${parameter}" (${number}) compared to document average (${average.toFixed(
                2
              )}).`,
              status: 'open'
            },
            newValidationResults
          );
        }
      }
    }

    // --------------------------------------------------
    // 5. Relational validation
    // --------------------------------------------------

    for (const [key, group] of Object.entries(
      groupedRecords
    )) {
      if (group.length < 2) {
        continue;
      }

      const productions = group.filter((record) =>
        isProduction(record.parameter)
      );

      const dispatches = group.filter((record) =>
        isDispatch(record.parameter)
      );

      const targets = group.filter((record) =>
        isTarget(record.parameter)
      );

      // -----------------------------------------------
      // Rule 6: Dispatch > Production
      // -----------------------------------------------

      for (const production of productions) {
        const productionValue = parseNumber(
          production.value
        );

        if (isNaN(productionValue)) {
          continue;
        }

        for (const dispatch of dispatches) {
          const dispatchValue = parseNumber(
            dispatch.value
          );

          if (isNaN(dispatchValue)) {
            continue;
          }

          if (dispatchValue > productionValue) {
            const gap =
              dispatchValue - productionValue;

            await createIssueIfNotExists(
              {
                documentId: dispatch.documentId,
                recordId: dispatch._id,
                type: 'conflict',
                severity: 'warning',
                field: 'value',
                message: `Dispatch (${dispatchValue}) exceeds Production (${productionValue}) for period ${
                  dispatch.period || 'Unknown'
                }. Gap: ${gap.toFixed(2)}.`,
                status: 'open'
              },
              newValidationResults
            );
          }
        }
      }

      // -----------------------------------------------
      // Rule 7: Production vs Target
      // -----------------------------------------------

      for (const production of productions) {
        const productionValue = parseNumber(
          production.value
        );

        if (isNaN(productionValue)) {
          continue;
        }

        for (const target of targets) {
          const targetValue = parseNumber(target.value);

          if (
            isNaN(targetValue) ||
            targetValue <= 0
          ) {
            continue;
          }

          const ratio =
            productionValue / targetValue;

          if (ratio > 1.5 || ratio < 0.5) {
            await createIssueIfNotExists(
              {
                documentId: production.documentId,
                recordId: production._id,
                type: 'suspicious_value',
                severity: 'warning',
                field: 'value',
                message: `Production (${productionValue}) deviates significantly from Target (${targetValue}) for period ${
                  production.period || 'Unknown'
                }.`,
                status: 'open'
              },
              newValidationResults
            );
          }
        }
      }

      // -----------------------------------------------
      // Rule 8: Duplicate parameters
      // -----------------------------------------------

      const parameterCounts = {};

      for (const record of group) {
        const parameter =
          normalizeStr(record.parameter);

        if (!parameter) {
          continue;
        }

        if (!parameterCounts[parameter]) {
          parameterCounts[parameter] = [];
        }

        parameterCounts[parameter].push(record);
      }

      for (const [parameter, duplicates] of Object.entries(
        parameterCounts
      )) {
        if (duplicates.length <= 1) {
          continue;
        }

        // Keep first record as original.
        // Flag all remaining records.
        for (let i = 1; i < duplicates.length; i++) {
          const duplicate = duplicates[i];

          await createIssueIfNotExists(
            {
              documentId: duplicate.documentId,
              recordId: duplicate._id,
              type: 'duplicate',
              severity: 'error',
              field: 'parameter',
              message: `Duplicate record found for parameter "${duplicate.parameter}" in period ${
                duplicate.period || 'Unknown'
              }.`,
              status: 'open'
            },
            newValidationResults
          );
        }
      }
    }

    // --------------------------------------------------
    // 6. Final result
    // --------------------------------------------------

    console.log('\n====================================');
    console.log(
      'NEW VALIDATION ISSUES:',
      newValidationResults.length
    );
    console.log('====================================\n');

    return newValidationResults;
  } catch (error) {
    console.error(
      'Error validating document:',
      error
    );

    throw error;
  }
};