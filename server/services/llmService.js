const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'default_key',
  baseURL: process.env.LLM_BASE_URL,
  fetch: async (url, init) => {
    const response = await fetch(url, init);
    if (!response.ok) {
      let text = await response.text();
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].error) {
          text = JSON.stringify(parsed[0]);
        }
      } catch (e) {}
      
      console.error(`[Gemini API Error] Status ${response.status}:`, text);
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }
    return response;
  }
});

const extractRetryAfterSeconds = (error) => {
  let seconds = 30;
  if (!error) return seconds;

  // Check headers: retry-after
  if (error.headers) {
    const hdr = error.headers['retry-after'] || error.headers['Retry-After'];
    if (hdr) {
      const parsedHdr = parseInt(hdr, 10);
      if (!isNaN(parsedHdr) && parsedHdr > 0) return parsedHdr;
    }
  }

  if (error.message) {
    const match = error.message.match(/retry in ([\d\.]+)s/i);
    if (match && match[1]) {
      seconds = Math.ceil(parseFloat(match[1])) || 30;
      return seconds;
    }
  }
  // Check details if parsed error payload exists
  try {
    const details = (error.error && Array.isArray(error.error.details) ? error.error.details : null) ||
                    (Array.isArray(error.errorDetails) ? error.errorDetails : null) ||
                    (Array.isArray(error.details) ? error.details : null);
    if (details) {
      const retryInfo = details.find(d => d['@type'] && d['@type'].includes('RetryInfo'));
      if (retryInfo && retryInfo.retryDelay) {
        const numMatch = retryInfo.retryDelay.match(/(\d+)/);
        if (numMatch) return parseInt(numMatch[1], 10);
      }
    }
  } catch (e) {}
  return seconds;
};
exports.extractRetryAfterSeconds = extractRetryAfterSeconds;

const withRetry = async (fn, maxRetries = 2, baseDelayMs = 2000) => {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (error.status === 429) {
        // No automatic retries for 429. Respect delay and return immediately.
        const retryAfterSec = extractRetryAfterSeconds(error);
        const rateLimitErr = new Error(`Gemini Rate Limit Exceeded. Please retry in ${retryAfterSec} seconds.`);
        rateLimitErr.code = 'AI_RATE_LIMIT';
        rateLimitErr.statusCode = 429;
        rateLimitErr.retryAfterSeconds = retryAfterSec;
        rateLimitErr.retryable = true;
        throw rateLimitErr;
      }

      // Check for context/token limit errors (400 or message indicating prompt/context length exceeded)
      const isContextLimit = error.status === 400 && (
        (error.message && (
          error.message.includes('context_length_exceeded') ||
          error.message.includes('too large') ||
          error.message.includes('token limit') ||
          error.message.includes('maximum context length') ||
          error.message.includes('Request payload size exceeds')
        ))
      );
      if (isContextLimit) {
        const contextErr = new Error('Report generation could not be completed because the AI request exceeded the available context limit.');
        contextErr.code = 'AI_CONTEXT_LIMIT';
        contextErr.statusCode = 422;
        contextErr.retryable = true;
        throw contextErr;
      }

      const is503 = error.status === 503 || error.statusCode === 503 || (error.message && (
        error.message.includes('503') ||
        error.message.toLowerCase().includes('high demand') ||
        error.message.includes('UNAVAILABLE')
      ));
      const isRetryable = is503 || (error.status && error.status >= 500);

      // Handle Gemini 503 with limited exponential backoff (max 2 retries, total 3 attempts)
      if (is503) {
        if (attempt > maxRetries) {
          const retryAfterSec = extractRetryAfterSeconds(error) || 30;
          const unavailableErr = new Error('AI service is temporarily unavailable. Please try again shortly.');
          unavailableErr.code = 'AI_SERVICE_UNAVAILABLE';
          unavailableErr.statusCode = 503;
          unavailableErr.retryAfterSeconds = retryAfterSec;
          unavailableErr.retryable = true;
          throw unavailableErr;
        }

        const retryAfterSec = extractRetryAfterSeconds(error);
        const delay = (retryAfterSec && retryAfterSec <= 10)
          ? retryAfterSec * 1000
          : Math.min(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500, 10000);

        console.warn(`[Retry ${attempt}/${maxRetries}] Gemini 503 high demand. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!isRetryable || attempt >= maxRetries) {
        error.code = error.code || 'AI_PROVIDER_ERROR';
        error.retryable = isRetryable;
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(`[Retry ${attempt}/${maxRetries}] Gemini API failed (Status: ${error.status}). Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const enforceCallLimit = (options, type = 'completion') => {
  if (options && options.reqContext) {
    const ctx = options.reqContext;
    ctx.llmCallCount = (ctx.llmCallCount || 0) + 1;

    if (type === 'embedding') {
      ctx.embeddingCallCount = (ctx.embeddingCallCount || 0) + 1;
      const embeddingLimit = ctx.maxEmbeddingCalls || 20;
      if (ctx.embeddingCallCount > embeddingLimit) {
        const err = new Error(`Maximum embedding calls (${embeddingLimit}) exceeded for this task.`);
        err.code = 'MAX_EMBEDDINGS_EXCEEDED';
        err.retryable = false;
        throw err;
      }
      return;
    }

    ctx.completionCallCount = (ctx.completionCallCount || 0) + 1;
    const completionLimit = ctx.maxCalls || (ctx.isComplex ? 8 : 5);
    if (ctx.completionCallCount > completionLimit) {
      const err = new Error(`Maximum LLM calls (${completionLimit}) exceeded for this task to protect API quota.`);
      err.code = 'MAX_CALLS_EXCEEDED';
      err.retryable = true;
      throw err;
    }
  }
};

exports.callLLM = async (systemPrompt, userPrompt, options = {}) => {
  try {
    enforceCallLimit(options, 'completion');
  } catch (err) {
    if (err.code === 'MAX_CALLS_EXCEEDED') {
      console.warn('Call limit reached in callLLM.');
      // Never return fallback error text if this is a report or strict generation!
      if (options.reqContext?.isReport || options.throwOnLimit) {
        const limitErr = new Error('Report generation could not be completed because the AI request exceeded the available context limit or call quota.');
        limitErr.code = 'AI_CONTEXT_LIMIT';
        limitErr.statusCode = 422;
        limitErr.retryable = true;
        throw limitErr;
      }
      if (options.format === 'json') {
        return { action: 'rag', message: 'API limits reached. Attempting to provide partial response.' };
      }
      return 'The task is very complex and reached the maximum API limits for this request. Please try breaking it down into smaller questions.';
    }
    throw err;
  }

  if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
    return {
      records: [{
        parameter: 'Coal Production', value: '5000', unit: 'tonnes', period: 'FY25', mineName: 'Test Mine', subsidiary: 'Test Sub', confidenceScore: 0.95, sourceText: 'Coal Production was 5000 tonnes'
      }]
    };
  }

  // Multi-model resilience: Try candidate models if primary model is rate limited
  const candidateModels = [
    options.model,
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash'
  ].filter(Boolean);
  const uniqueModels = [...new Set(candidateModels)];

  let lastError = null;
  for (let mIdx = 0; mIdx < uniqueModels.length; mIdx++) {
    const currentModel = uniqueModels[mIdx];
    try {
      const response = await withRetry(async () => {
        return await openai.chat.completions.create({
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }, { timeout: options.timeout || 60000 });
      }, options.maxRetries || 2);

      let content = response.choices[0].message.content;
      
      if (options.format === 'json') {
        try {
          // Strip markdown formatting if present
          let cleanContent = content.replace(/```json\s*/ig, '').replace(/```\s*/g, '').trim();
          
          // Find the first { or [ and the last } or ]
          const firstBrace = cleanContent.indexOf('{');
          const firstBracket = cleanContent.indexOf('[');
          const lastBrace = cleanContent.lastIndexOf('}');
          const lastBracket = cleanContent.lastIndexOf(']');
          
          let startIndex = -1;
          let endIndex = -1;
          
          // Determine whether the JSON is an object or an array
          if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIndex = firstBrace;
            endIndex = lastBrace;
          } else if (firstBracket !== -1) {
            startIndex = firstBracket;
            endIndex = lastBracket;
          }
          
          if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
            cleanContent = cleanContent.substring(startIndex, endIndex + 1);
          }
          
          if (!cleanContent) throw new Error('Empty JSON response');
          
          return JSON.parse(cleanContent);
        } catch (parseError) {
          console.warn('Failed to parse LLM JSON response:', parseError.message);
          console.warn('Raw LLM Response:', content);
          // Fallback for agentOrchestrator classification
          return { action: 'rag', parameters: null, message: content, error: parseError.message };
        }
      }
      
      return content;
    } catch (error) {
      lastError = error;
      const isCapacityOrQuota = error.code === 'AI_RATE_LIMIT' || error.code === 'AI_SERVICE_UNAVAILABLE' || error.status === 503 || error.statusCode === 429;
      if (isCapacityOrQuota && mIdx < uniqueModels.length - 1) {
        console.warn(`[Model Fallback] Model ${currentModel} returned capacity/quota limit (${error.code || error.status}). Failing over to ${uniqueModels[mIdx + 1]}...`);
        continue;
      }
      console.error(`Error calling LLM with model ${currentModel}:`, error.message);
      throw error;
    }
  }
  throw lastError;
};

exports.generateEmbedding = async (textOrArray, options = {}) => {
  enforceCallLimit(options, 'embedding');

  if (process.env.LLM_API_KEY === 'mock-key-for-testing') {
    const isArray = Array.isArray(textOrArray);
    if (isArray) {
      return textOrArray.map(() => Array.from({ length: 768 }, () => Math.random() - 0.5));
    }
    return Array.from({ length: 768 }, () => Math.random() - 0.5);
  }

  try {
    const response = await withRetry(async () => {
      return await openai.embeddings.create({
        model: 'gemini-embedding-2',
        input: textOrArray
      }, { timeout: options.timeout || 30000 });
    }, options.maxRetries || 3);
    
    if (Array.isArray(textOrArray)) {
      return response.data.map(d => d.embedding);
    }
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

exports.classifyDocument = async (text, options = {}) => {
  const systemPrompt = `You are a Document Classifier. Classify the provided text into exactly ONE of the following categories:
- Production Report
- Safety Manual
- Logistics Return
- Compliance Notice
- Financial Statement
- Other

Return ONLY a JSON object: {"category": "The Category"}`;
  
  const userPrompt = `Document text:\n${text.substring(0, 3000)}`;
  
  try {
    const res = await exports.callLLM(systemPrompt, userPrompt, { format: 'json', reqContext: { isComplex: false }, ...options });
    return res.category || 'Uncategorized';
  } catch (err) {
    console.warn("Classification failed:", err.message);
    return 'Uncategorized';
  }
};
