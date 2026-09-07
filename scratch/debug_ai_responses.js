const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function debug() {
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'vishal', password: 'miniIntel@SIH26023' });
  const token = loginRes.data.data.token;

  // Test WHY question
  console.log('\n--- TESTING WHY QUESTION ---');
  const whyRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/ai-assistant/query',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { query: 'Why did production decrease in Q3 FY2026?' });
  console.log('WHY Answer:', whyRes.data.data.answer);
  console.log('WHY Citations:', JSON.stringify(whyRes.data.data.citations, null, 2));

  // Test Martian question
  console.log('\n--- TESTING OUT OF DOMAIN QUESTION ---');
  const outRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/ai-assistant/query',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { query: 'What was the lithium extraction volume in the Martian crater mine in 2010?' });
  console.log('Out of domain data:', JSON.stringify(outRes.data.data, null, 2));

  // Test Citations
  console.log('\n--- TESTING CITATIONS QUESTION ---');
  const citRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/ai-assistant/ask',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { question: 'Summarize production achievements across Q1, Q2, and Q3 FY2026.' });
  console.log('Citations:', JSON.stringify(citRes.data.data.citations, null, 2));
}

debug().catch(console.error);
