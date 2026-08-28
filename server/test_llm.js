require('dotenv').config();
const llmService = require('./services/llmService');
(async () => {
  try {
    const sys = 'You extract data and return ONLY JSON like {"records": []}';
    const user = 'Extract from this: Coal production was 15 MT in FY23 for Jayant mine, subsidiary NCL.';
    const res = await llmService.callLLM(sys, user, { format: 'json' });
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
})();
