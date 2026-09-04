const Conversation = require('../models/Conversation');
const ragService = require('./ragService');
const llmService = require('./llmService');
const ExtractedRecord = require('../models/ExtractedRecord');
const miningIntelligenceService = require('./miningIntelligenceService');

function requiresAnalysis(question) {
  const q = question.toLowerCase();
  return q.includes('trend') || q.includes('compar') || q.includes('variance') || q.includes('anomal') || q.includes('decreas') || q.includes('increas') || q.includes('why') || q.includes('chang');
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
    
    if (isAnalytical) {
      const { summaryText, evidenceText, combinedSources } = await miningIntelligenceService.analyzeDataAndFindAnomalies(reqContext);
      contextText += summaryText + '\n' + evidenceText + '\n';
      sources = combinedSources;
    }

    // Always do standard semantic search for additional context
    const similarChunks = await ragService.searchSimilar(question, 3, reqContext);
    
    if (similarChunks.length > 0) {
      contextText += "=== GENERAL KNOWLEDGE BASE ===\n";
      similarChunks.forEach((chunk, index) => {
        contextText += `--- Chunk ${index + 1} (Page: ${chunk.pageNumber}) ---\n${chunk.content}\n\n`;
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
3. Evidence: What source supports the finding? (Cite the document name and page)
4. Explanation: What reason is recorded in the available documents? (Do not invent reasons. If no supporting evidence was found, say "No supporting evidence was found in the available documents.")
`;
  }
  
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
