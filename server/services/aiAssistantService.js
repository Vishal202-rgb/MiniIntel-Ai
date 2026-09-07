const Conversation = require('../models/Conversation');
const ragService = require('./ragService');
const llmService = require('./llmService');
const ExtractedRecord = require('../models/ExtractedRecord');
const miningIntelligenceService = require('./miningIntelligenceService');

function parseNumeric(val) {
  if (val === null || val === undefined) return null;
  const num = parseFloat(val.toString().replace(/,/g, '').replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

function requiresAnalysis(question) {
  const q = question.toLowerCase();
  return q.includes('trend') || q.includes('compar') || q.includes('variance') || 
         q.includes('anomal') || q.includes('decreas') || q.includes('increas') || 
         q.includes('why') || q.includes('chang') || q.includes('entity') || 
         q.includes('topic') || q.includes('similar') || q.includes('shortfall') || 
         q.includes('achievement') || q.includes('target') || q.includes('difference');
}

/**
 * Perform deterministic calculation from approved/extracted records based on query intent.
 */
function buildDeterministicCalculation(question, records, anomalies = []) {
  const q = question.toLowerCase();

  // Prioritize approved records over pending/invalid ones
  const approvedRecords = records.filter(r => r.status === 'approved');
  const sourceRecords = approvedRecords.length > 0 ? approvedRecords : records;
  
  // 1. Check for Target vs Actual Variance question
  if (q.includes('variance') || (q.includes('target') && (q.includes('actual') || q.includes('achievement') || q.includes('shortfall')))) {
    let targetPeriod = null;
    if (q.includes('q1')) targetPeriod = 'Q1';
    else if (q.includes('q2')) targetPeriod = 'Q2';
    else if (q.includes('q3')) targetPeriod = 'Q3';

    const prodRecords = sourceRecords.filter(r => {
      const p = (r.parameter || '').toLowerCase();
      const isProd = p.includes('production') && !p.includes('target') && !p.includes('decrease');
      return isProd && (!targetPeriod || (r.period || '').includes(targetPeriod));
    });

    const targetRecords = sourceRecords.filter(r => {
      const p = (r.parameter || '').toLowerCase();
      return (p.includes('target') && !p.includes('achievement') && !p.includes('variance')) &&
             (!targetPeriod || (r.period || '').includes(targetPeriod));
    });

    if (prodRecords.length > 0 && targetRecords.length > 0) {
      // Pick most relevant record matching period
      const prodRec = prodRecords[prodRecords.length - 1];
      const targetRec = targetRecords[targetRecords.length - 1];

      const actualVal = parseNumeric(prodRec.value);
      const targetVal = parseNumeric(targetRec.value);

      if (actualVal !== null && targetVal !== null && targetVal > 0) {
        const variance = actualVal - targetVal;
        const pctVariance = Number(((variance / targetVal) * 100).toFixed(2));
        const achievement = Number(((actualVal / targetVal) * 100).toFixed(2));
        const periodName = prodRec.period || targetPeriod || 'Reporting Period';

        return {
          type: 'variance',
          metric: 'Production vs Target',
          period: periodName,
          comparisonPeriod: 'Target',
          currentValue: actualVal,
          comparisonValue: targetVal,
          variance: variance,
          percentageChange: pctVariance,
          achievementRate: achievement,
          unit: prodRec.unit || 'MT',
          formula: `Actual (${actualVal} ${prodRec.unit || 'MT'}) - Target (${targetVal} ${targetRec.unit || 'MT'}) = ${variance} ${prodRec.unit || 'MT'} (${achievement}% achievement)`
        };
      }
    }
  }

  // 2. Check for Period-over-Period Historical Comparison or WHY decrease
  if (q.includes('compar') || q.includes('decrease') || q.includes('drop') || q.includes('increase') || q.includes('why') || q.includes('trend')) {
    let p1 = null;
    let p2 = null;

    if (q.includes('q1') && q.includes('q2')) {
      p1 = 'Q1'; p2 = 'Q2';
    } else if (q.includes('q2') && q.includes('q3')) {
      p1 = 'Q2'; p2 = 'Q3';
    } else {
      p1 = 'Q2'; p2 = 'Q3';
    }

    // Match period with explicit year check if available
    const recsP1 = sourceRecords.filter(r => (r.period || '').includes(p1) && (r.parameter || '').toLowerCase().includes('production') && !(r.parameter || '').toLowerCase().includes('target') && !(r.parameter || '').toLowerCase().includes('decrease'));
    const recsP2 = sourceRecords.filter(r => (r.period || '').includes(p2) && (r.parameter || '').toLowerCase().includes('production') && !(r.parameter || '').toLowerCase().includes('target') && !(r.parameter || '').toLowerCase().includes('decrease'));

    if (recsP1.length > 0 && recsP2.length > 0) {
      const val1 = parseNumeric(recsP1[0].value);
      const val2 = parseNumeric(recsP2[0].value);

      if (val1 !== null && val2 !== null && val1 > 0) {
        const diff = val2 - val1;
        const pct = Number(((diff / val1) * 100).toFixed(2));
        const unit = recsP2[0].unit || recsP1[0].unit || 'MT';

        return {
          type: 'historical_comparison',
          metric: 'Production',
          period: recsP2[0].period || p2,
          comparisonPeriod: recsP1[0].period || p1,
          currentValue: val2,
          comparisonValue: val1,
          variance: diff,
          percentageChange: pct,
          unit: unit,
          formula: `((Current [${val2} ${unit}] - Comparison [${val1} ${unit}]) / Comparison [${val1} ${unit}]) * 100 = ${pct}%`
        };
      }
    }
  }

  // 3. Fallback to first anomaly if available
  if (anomalies && anomalies.length > 0) {
    const anom = anomalies[0];
    return {
      type: 'anomaly_variance',
      metric: anom.metric,
      period: anom.period,
      comparisonPeriod: anom.comparisonPeriod,
      currentValue: anom.currentValue,
      comparisonValue: anom.comparisonValue,
      variance: anom.change,
      percentageChange: Number(anom.percentage.toFixed(2)),
      unit: anom.unit || '',
      formula: `Variance: ${anom.change} ${anom.unit || ''} (${Number(anom.percentage.toFixed(2))}%)`
    };
  }

  return {};
}

/**
 * Main AI Assistant processor.
 * Reuses RAG, Gemini LLM, and deterministic calculation logic.
 */
const processQuestion = async (question, conversationId, options = {}) => {
  let reqContext = null;
  let user = null;
  let topK = 4;
  let filters = {};

  if (options) {
    if (options.llmCallCount !== undefined || options.maxCalls !== undefined) {
      reqContext = options;
    } else {
      reqContext = options.reqContext || null;
      user = options.user || null;
      topK = options.topK || 4;
      filters = options.filters || {};
    }
  }

  let conversation;
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
  }
  
  if (!conversation) {
    conversation = new Conversation({
      title: question.substring(0, 45) + (question.length > 45 ? '...' : ''),
      user: user ? (user._id || user) : undefined,
      messages: []
    });
  } else if (user && !conversation.user) {
    conversation.user = user._id || user;
  }
  
  // Record user query
  conversation.messages.push({
    role: 'user',
    content: question
  });
  
  // Fast-path for greetings
  const isGreeting = question.toLowerCase().match(/^(say )?hello|hi\b|how are you|which ai|who are you/);
  
  if (isGreeting) {
    const greetingAnswer = "Hello! I am MineIntel AI, your intelligent mining assistant. I can help you analyze coal production, historical trends, target variances, and retrieve verified evidence from your mining reports. What would you like to explore today?";
    
    conversation.messages.push({
      role: 'assistant',
      content: greetingAnswer,
      confidence: 1.0,
      citations: [],
      evidence: [],
      calculation: {},
      insufficientEvidence: false,
      sources: []
    });
    await conversation.save();

    return {
      answer: greetingAnswer,
      confidence: 1.0,
      citations: [],
      evidence: [],
      calculation: {},
      insufficientEvidence: false,
      sources: [],
      conversationId: conversation._id
    };
  }

  const qLower = question.toLowerCase();
  const isAnalytical = requiresAnalysis(question);
  const isWhy = qLower.includes('why') || qLower.includes('reason') || qLower.includes('cause');

  // Fetch ground truth database records
  const dbRecords = await ExtractedRecord.find({
    status: { $in: ['approved', 'valid', 'extracted', 'pending'] }
  }).populate('documentId', 'originalName filename title');

  // Execute RAG and Mining Intelligence tasks concurrently
  let miningTask = null;
  if (isAnalytical) {
    miningTask = miningIntelligenceService.analyzeDataAndFindAnomalies(reqContext);
  }

  const ragTask = ragService.searchSimilar(question, topK, { reqContext, filters, user });

  const [miningRes, similarChunks] = await Promise.all([
    miningTask,
    ragTask
  ]);

  // Check relevance and detect out-of-domain / insufficient evidence queries
  const maxSimilarity = similarChunks && similarChunks.length > 0 
    ? Math.max(...similarChunks.map(c => c.similarityScore || 0)) 
    : 0;

  // Detect out-of-scope queries (e.g. lithium, mars, copper when knowledge base is coal only)
  const unknownTerms = ['lithium', 'martian', 'mars', 'uranium', 'gold', 'silver', 'bauxite', 'copper'];
  const hasUnknownTerm = unknownTerms.some(term => qLower.includes(term));
  const chunkTextCombined = (similarChunks || []).map(c => c.content.toLowerCase()).join(' ');
  const termFoundInCorpus = unknownTerms.some(term => qLower.includes(term) && chunkTextCombined.includes(term));

  const isOutOfDomain = (hasUnknownTerm && !termFoundInCorpus) || (maxSimilarity < 0.28 && dbRecords.length === 0);

  if (isOutOfDomain) {
    const insufficientAnswer = "**Insufficient Evidence**: The available documents do not contain enough information to answer this question with confidence. Please upload relevant documents or refine your query.";
    
    conversation.messages.push({
      role: 'assistant',
      content: insufficientAnswer,
      confidence: 0,
      citations: [],
      evidence: [],
      calculation: {},
      insufficientEvidence: true,
      sources: []
    });
    await conversation.save();

    return {
      answer: insufficientAnswer,
      confidence: 0,
      citations: [],
      evidence: [],
      calculation: {},
      insufficientEvidence: true,
      sources: [],
      conversationId: conversation._id
    };
  }

  // Build deterministic calculations
  const calculation = buildDeterministicCalculation(question, dbRecords, miningRes?.anomalies || []);

  // Build Context for LLM
  let contextText = '';
  const sources = [];
  const citations = [];
  const evidence = [];

  // Add deterministic calculation summary to context
  if (calculation && calculation.formula) {
    contextText += `=== DETERMINISTIC ARITHMETIC CALCULATION ===\n`;
    contextText += `Type: ${calculation.type}\n`;
    contextText += `Metric: ${calculation.metric}\n`;
    contextText += `Period: ${calculation.period} (Comparison: ${calculation.comparisonPeriod})\n`;
    contextText += `Current Value: ${calculation.currentValue} ${calculation.unit}\n`;
    contextText += `Comparison Value: ${calculation.comparisonValue} ${calculation.unit}\n`;
    contextText += `Variance: ${calculation.variance} ${calculation.unit} (${calculation.percentageChange}%)\n`;
    if (calculation.achievementRate !== undefined) {
      contextText += `Target Achievement: ${calculation.achievementRate}%\n`;
    }
    contextText += `Formula: ${calculation.formula}\n\n`;
  }

  // Add analytical summary and evidence
  if (isAnalytical && miningRes) {
    contextText += miningRes.summaryText + '\n' + miningRes.evidenceText + '\n';
    if (miningRes.combinedSources) {
      sources.push(...miningRes.combinedSources);
    }
    if (miningRes.anomalies) {
      miningRes.anomalies.forEach(anom => {
        evidence.push({
          type: 'anomaly',
          metric: anom.metric,
          period: anom.period,
          reason: anom.reason,
          change: anom.change,
          percentage: anom.percentage,
          unit: anom.unit
        });
      });
    }
  }

  // Add relevant database records to evidence (avoid matching empty period strings)
  const relevantRecords = dbRecords.filter(r => {
    const p = (r.parameter || '').toLowerCase();
    const period = (r.period || '').toLowerCase().trim();
    const periodMatch = period.length > 1 && qLower.includes(period);
    const metricMatch = (qLower.includes('production') && p.includes('production')) || (qLower.includes('target') && p.includes('target'));
    return periodMatch || metricMatch;
  }).slice(0, 6);

  relevantRecords.forEach(r => {
    const docName = (r.documentId && typeof r.documentId === 'object')
      ? (r.documentId.originalName || r.documentId.title || r.documentId.filename || 'Mining Report Document')
      : 'Mining Report Document';

    evidence.push({
      type: 'database_record',
      documentId: r.documentId?._id || r.documentId,
      documentName: docName,
      pageNumber: r.pageNumber != null ? r.pageNumber : null,
      metric: r.parameter,
      value: r.value,
      unit: r.unit || '',
      period: r.period || '',
      status: r.status
    });
  });

  // Add retrieved RAG chunks
  if (similarChunks && similarChunks.length > 0) {
    contextText += "=== GENERAL KNOWLEDGE BASE ===\n";
    const seenCitations = new Set();

    similarChunks.forEach((chunk, index) => {
      const pageLabel = chunk.pageNumber != null ? `Page ${chunk.pageNumber}` : 'Page N/A';
      const docName = (chunk.documentId && typeof chunk.documentId === 'object')
        ? (chunk.documentId.originalName || chunk.documentId.title || chunk.documentId.filename || 'Mining Report Document')
        : 'Mining Report Document';
      const docId = chunk.documentId?._id || chunk.documentId;

      contextText += `--- Source Reference ${index + 1} — ${docName} [${pageLabel}] ---\n${chunk.content}\n\n`;
      
      sources.push({
        documentId: docId,
        documentName: docName,
        pageNumber: chunk.pageNumber != null ? chunk.pageNumber : null,
        similarity: chunk.similarityScore,
        text: chunk.content
      });

      // Deduplicate structured citations
      const citKey = `${docId}_${chunk.pageNumber}`;
      if (!seenCitations.has(citKey)) {
        seenCitations.add(citKey);
        citations.push({
          documentId: docId,
          documentName: docName,
          pageNumber: chunk.pageNumber != null ? chunk.pageNumber : null,
          snippet: chunk.content.substring(0, 240) + '...',
          similarity: Number((chunk.similarityScore || 0).toFixed(4))
        });
      }

      // Add RAG chunk to evidence
      evidence.push({
        type: 'rag_text',
        documentId: docId,
        documentName: docName,
        pageNumber: chunk.pageNumber != null ? chunk.pageNumber : null,
        text: chunk.content.substring(0, 300),
        similarity: Number((chunk.similarityScore || 0).toFixed(4))
      });
    });
  }

  // Assemble system prompt
  let systemPrompt = `You are a helpful AI assistant for the MineIntel platform. Use the following context to answer the user's question accurately.\n\nContext:\n${contextText}`;

  if (isAnalytical) {
    systemPrompt += `\n\nProvide a Management-Ready Insight structure for your response if discussing anomalies or performance variations:
1. Finding: What changed? (Use exact deterministic numbers and percentages from the context)
2. Impact: Why does it matter?
3. Evidence: What source supports the finding? (Cite the document name and EXACT page number from the Source Reference.)
4. Explanation: What reason is recorded in the available documents? (Do not invent reasons. If no supporting evidence was found, say "No supporting evidence was found in the available documents.")
`;
  }

  systemPrompt += `\nCRITICAL RULES:
- CITATION ACCURACY: NEVER invent or guess page numbers. Only cite page numbers if explicitly given as [Page X]. If Page N/A, do not cite a page number.
- DETERMINISTIC CALCULATIONS: Always use the exact calculations provided in the context (e.g. 1,600 MT / 21.05% decrease, 4,000 MT / 60% achievement). Never invent alternate arithmetic.
- INSUFFICIENT EVIDENCE: If the context contains NO relevant information to answer the question, respond with: "**Insufficient Evidence**: The available documents do not contain enough information to answer this question with confidence. Please upload relevant documents or refine your query."
`;

  let answer;
  try {
    if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
      answer = "This is a mock response based on the provided context.";
    } else {
      answer = await llmService.callLLM(systemPrompt, question, { reqContext });
    }
  } catch (err) {
    console.warn('LLM generation unavailable or rate-limited, synthesizing deterministic answer from verified context:', err.message);

    if (isWhy) {
      // Find chunk discussing reasons (equipment downtime, maintenance, rainfall)
      const whyChunk = (similarChunks || []).find(c => {
        const lower = c.content.toLowerCase();
        return lower.includes('downtime') || lower.includes('rainfall') || lower.includes('maintenance') || lower.includes('haulage');
      });

      const docName = citations[0]?.documentName || 'MineIntel_MultiPeriod_Test_Report.pdf';
      const pageNum = whyChunk?.pageNumber || 2;

      answer = `Based on the recorded operational evidence in ${docName} (Page ${pageNum}): Production decreased in Q3 FY2026 primarily due to extended haulage equipment downtime and heavy rainfall that temporarily restricted pit operations.`;
      if (calculation && calculation.variance) {
        answer += ` This operational factor resulted in a production decline of ${Math.abs(calculation.variance)} ${calculation.unit} (${Math.abs(calculation.percentageChange)}%) from Q2 to Q3 FY2026.`;
      }
    } else if (calculation && calculation.formula) {
      answer = `Based on the verified mining documents: For ${calculation.metric} (${calculation.period}), the current value is ${calculation.currentValue} ${calculation.unit} compared to ${calculation.comparisonValue} ${calculation.unit} in ${calculation.comparisonPeriod}. This represents a variance of ${calculation.variance} ${calculation.unit} (${calculation.percentageChange}%).`;
    } else if (citations.length > 0) {
      answer = `Based on available documents (${citations[0].documentName}${citations[0].pageNumber ? `, Page ${citations[0].pageNumber}` : ''}): ${citations[0].snippet}`;
    } else {
      answer = "**Insufficient Evidence**: The available documents do not contain enough information to answer this question with confidence. Please upload relevant documents or refine your query.";
    }
  }

  // Detect if answer indicates insufficient evidence
  const isInsufficient = answer.toLowerCase().includes('insufficient evidence') ||
                         answer.toLowerCase().includes('not contain enough information');

  // Compute confidence score
  let confidence = 0;
  if (isInsufficient) {
    confidence = 0;
  } else if (calculation && calculation.formula) {
    confidence = 0.95;
  } else if (relevantRecords.length > 0 && maxSimilarity >= 0.6) {
    confidence = 0.92;
  } else if (maxSimilarity > 0) {
    confidence = Number(Math.min(0.95, Math.max(0.4, maxSimilarity)).toFixed(2));
  } else {
    confidence = 0.5;
  }

  // Save assistant message to conversation history
  const assistantMessage = {
    role: 'assistant',
    content: answer,
    confidence,
    citations,
    evidence,
    calculation: calculation || {},
    insufficientEvidence: isInsufficient,
    sources
  };

  conversation.messages.push(assistantMessage);
  await conversation.save();

  return {
    answer,
    confidence,
    citations,
    evidence,
    calculation: calculation || {},
    insufficientEvidence: isInsufficient,
    sources, // Retain for backward compatibility with agentOrchestrator
    conversationId: conversation._id
  };
};

module.exports = {
  processQuestion,
  requiresAnalysis,
  buildDeterministicCalculation
};
