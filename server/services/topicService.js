const Topic = require('../models/Topic');
const Document = require('../models/Document');
const llmService = require('./llmService');

const extractTopics = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const textContent = document.content || '';
    if (!textContent) {
      return [];
    }

    // Use llmService to extract topics
    const prompt = `Extract the main topics and keywords from the following text. Return the result as a JSON array of objects, where each object has a 'name' (string) and 'keywords' (array of strings).\n\nText:\n${textContent.substring(0, 5000)}`;
    const responseText = await llmService.generateResponse(prompt);
    
    let topicsData = [];
    try {
      topicsData = JSON.parse(responseText);
    } catch (e) {
      // Fallback if not valid JSON
      topicsData = [{ name: 'Extracted Topic', keywords: ['extracted', 'topic'] }];
    }

    const createdTopics = [];
    for (const data of topicsData) {
      let topic = await Topic.findOne({ name: data.name });
      if (!topic) {
        topic = new Topic({
          name: data.name,
          keywords: data.keywords || [],
          documents: [documentId]
        });
      } else {
        if (!topic.documents.includes(documentId)) {
          topic.documents.push(documentId);
        }
        topic.keywords = [...new Set([...topic.keywords, ...(data.keywords || [])])];
      }
      await topic.save();
      createdTopics.push(topic);
    }

    return createdTopics;
  } catch (error) {
    throw new Error('Error extracting topics: ' + error.message);
  }
};

module.exports = {
  extractTopics
};
