const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'default_key',
  baseURL: process.env.LLM_BASE_URL
});

exports.callLLM = async (systemPrompt, userPrompt, options = {}) => {
  if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
    return {
      records: [{
        parameter: 'Coal Production',
        value: '5000',
        unit: 'tonnes',
        period: 'FY25',
        mineName: 'Test Mine',
        subsidiary: 'Test Sub',
        confidenceScore: 0.95,
        sourceText: 'Coal Production was 5000 tonnes'
      }]
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error calling LLM:', error);
    throw error;
  }
};

exports.generateEmbedding = async (text) => {
  if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};
