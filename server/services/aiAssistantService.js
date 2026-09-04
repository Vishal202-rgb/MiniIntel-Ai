const Conversation = require('../models/Conversation');
const ragService = require('./ragService');
const llmService = require('./llmService');
const ExtractedRecord = require('../models/ExtractedRecord');
const miningIntelligenceService = require('./miningIntelligenceService');

function requiresAnalysis(question) {
  const q = question.toLowerCase();
  return q.includes('trend') || q.includes('compar') || q.includes('variance') || q.includes('anomal') || q.includes('decreas') || q.includes('increas') || q.includes('why') || q.includes('chang') || q.includes('entity') || q.includes('topic') || q.includes('similar');
}

const processQuestion = async (question, conversationId, reqContext = null) => {
  let conversation;
  
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
  }
  
  if (!conversation) {
    conversation = new Conversation({
      title: question.substring(0, 40) + '...',
      messages: []
    });
  }
  
  // Add user message
  conversation.messages.push({
    role: 'user',
    content: question
  });
  
  // Fast-path: Skip RAG vector search for simple greetings to save API quota
  const isGreeting = question.toLowerCase().match(/^(say )?hello|hi\b|how are you|which ai|who are you/);
  
  let contextText = '';
  let sources = [];
  let isAnalytical = false;

  if (!isGreeting) {
    // Determine if question needs analytical reasoning
    isAnalytical = requiresAnalysis(question);
    
    let miningTask = null;
    let ragTask = null;

    if (isAnalytical) {
      miningTask = miningIntelligenceService.analyzeDataAndFindAnomalies(reqContext);
    }

    // Always do standard semantic search for additional context
    ragTask = ragService.searchSimilar(question, 3, reqContext);

    // Wait for both concurrently
    const [miningRes, similarChunks] = await Promise.all([
      miningTask,
      ragTask
    ]);

    if (isAnalytical && miningRes) {
      contextText += miningRes.summaryText + '\n' + miningRes.evidenceText + '\n';
      sources.push(...miningRes.combinedSources);
    }

    if (similarChunks && similarChunks.length > 0) {
      contextText += "=== GENERAL KNOWLEDGE BASE ===\n";
      similarChunks.forEach((chunk, index) => {
        const pageLabel = chunk.pageNumber ? `Page ${chunk.pageNumber}` : 'Page N/A';
        const docName = chunk.documentId ? (chunk.documentId.originalName || chunk.documentId.filename) : 'Unknown Document';
        contextText += `--- Source Reference ${index + 1} — ${docName} [${pageLabel}] ---\n${chunk.content}\n\n`;
        sources.push({
          documentId: chunk.documentId,
          pageNumber: chunk.pageNumber,
          similarity: chunk.similarityScore,
          text: chunk.content
        });
      });
    }
  }
  
  let systemPrompt = `You are a helpful AI assistant for the MineIntel platform. ${
    isGreeting 
      ? 'Briefly introduce yourself.' 
      : 'Use the following context to answer the user\'s question. If you don\'t know the answer based on the context, say so.\n\nContext:\n' + contextText
  }`;
  
  if (isAnalytical) {
    systemPrompt += `\n\nProvide a Management-Ready Insight structure for your response if discussing anomalies:
1. Finding: What changed? (Use deterministic numbers from context)
2. Impact: Why does it matter?
3. Evidence: What source supports the finding? (Cite the document name and EXACT page number from the Source Metadata/Reference.)
4. Explanation: What reason is recorded in the available documents? (Do not invent reasons. If no supporting evidence was found, say "No supporting evidence was found in the available documents.")
`;
  }

  systemPrompt += `\nCRITICAL CITATION RULES:
- NEVER guess or infer a page number.
- If a source says [Page N/A] or does not have a page number, you MUST NOT write "Page 1". Simply cite the document name or reference number.
- Only cite the page number if it is explicitly provided in the bracketed source reference (e.g., [Page 2]).

INSUFFICIENT EVIDENCE RULE:
- If the provided context contains NO relevant information to answer the question, you MUST respond: "**Insufficient Evidence**: The available documents do not contain enough information to answer this question with confidence. Please upload relevant documents or refine your query."
- NEVER invent numeric values, evidence, or citations. If evidence is not found, say so clearly.
`;

  let answer;
  if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
    answer = "This is a mock response based on the provided context.";
  } else {
    answer = await llmService.callLLM(systemPrompt, question, { reqContext });
  }
  
  // Add assistant message
  const assistantMessage = {
    role: 'assistant',
    content: answer,
    sources
  };
  
  conversation.messages.push(assistantMessage);
  await conversation.save();
  
  return {
    answer,
    sources,
    conversationId: conversation._id
  };
};

module.exports = {
  processQuestion
};
