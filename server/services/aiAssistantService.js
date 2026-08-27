const Conversation = require('../models/Conversation');
const ragService = require('./ragService');
const llmService = require('./llmService');
const ExtractedRecord = require('../models/ExtractedRecord');

const processQuestion = async (question, conversationId) => {
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
  
  const similarChunks = await ragService.searchSimilar(question, 5);
  
  let contextText = '';
  const sources = [];
  
  similarChunks.forEach((chunk, index) => {
    contextText += `--- Chunk ${index + 1} (Page: ${chunk.pageNumber}) ---\n${chunk.content}\n\n`;
    sources.push({
      documentId: chunk.documentId,
      pageNumber: chunk.pageNumber,
      similarity: chunk.similarityScore
    });
  });
  
  const systemPrompt = `You are a helpful AI assistant for the MineIntel platform. Use the following context to answer the user's question. If you don't know the answer based on the context, say so.\n\nContext:\n${contextText}`;
  
  let answer;
  if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
    answer = "This is a mock response based on the provided context.";
  } else {
    answer = await llmService.callLLM(systemPrompt, question);
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
