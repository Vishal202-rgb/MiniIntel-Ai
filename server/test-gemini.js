require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
  fetch: async (url, init) => {
    console.log('Fetching:', url);
    const response = await fetch(url, init);
    const clone = response.clone();
    console.log('Status:', response.status);
    const text = await clone.text();
    console.log('Raw Response Body:', text);
    return response;
  }
});

async function runTest() {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      messages: [
        { role: 'user', content: 'Say hello in one sentence.' }
      ]
    });
    console.log('Success:', response.choices[0].message.content);
  } catch (error) {
    console.error('API Error:', error.message);
  }
}

runTest();
