const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(message);
  } else {
    console.log(`[PASS] ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING AI ASSISTANT & RAG REST API TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      passed++;
    } catch (err) {
      console.error(`TEST FAILED: ${name} -> ${err.message}`);
      failed++;
    }
  };

  // 1. Authenticate Admin
  let adminToken;
  await test('Admin authentication succeeds', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: 'vishal', password: 'miniIntel@SIH26023' });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Admin login failed');
    adminToken = res.data.data.token;
  });

  // 2. Register / Authenticate Regular User
  let userToken;
  let regularUserId;
  await test('Regular user registration / login succeeds', async () => {
    const username = `ai_user_${Date.now().toString().slice(-6)}`;
    const email = `${username}@mineintel.test`;
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username,
      email,
      password: 'UserPass@123',
      role: 'reviewer'
    });

    assert(res.status === 201, `Registration returned ${res.status}`);
    userToken = res.data.data.token;
    regularUserId = res.data.data._id || res.data.data.id;
  });

  // 3. Validation: POST /api/v1/ai-assistant/query with missing query returns 400
  await test('POST /api/v1/ai-assistant/query with missing query returns 400 error', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {});

    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.data.success === false, 'Expected success: false');
    assert(Array.isArray(res.data.errors), 'Expected errors array');
  });

  // 4. Scenario 1: Normal Question
  let conversationId;
  await test('Scenario 1: Normal question returns answer, citations, confidence > 0.8', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      query: 'What was the coal production in Q1 FY2026?'
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success: true');
    const data = res.data.data;
    assert(typeof data.answer === 'string' && data.answer.length > 20, 'Expected detailed answer');
    assert(data.confidence >= 0.8, `Expected confidence >= 0.8, got ${data.confidence}`);
    assert(data.insufficientEvidence === false, 'insufficientEvidence should be false');
    assert(Array.isArray(data.citations) && data.citations.length > 0, 'Expected citations array');
    assert(data.citations[0].pageNumber === 1 || data.citations[0].pageNumber === 2, 'Citation pageNumber should be 1 or 2');
    assert(data.conversationId, 'Expected conversationId to be returned');
    conversationId = data.conversationId;
  });

  // 5. Scenario 2: Historical Comparison
  await test('Scenario 2: Historical comparison returns deterministic calculation for Q2 vs Q3', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      query: 'Compare coal production between Q2 and Q3 FY2026.',
      conversationId
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.calculation != null, 'Expected calculation object');
    assert(data.calculation.currentValue === 6000, `Expected currentValue 6000, got ${data.calculation.currentValue}`);
    assert(data.calculation.comparisonValue === 7600, `Expected comparisonValue 7600, got ${data.calculation.comparisonValue}`);
    assert(data.calculation.variance === -1600, `Expected variance -1600, got ${data.calculation.variance}`);
    assert(Math.abs(data.calculation.percentageChange - (-21.05)) < 0.1, `Expected ~ -21.05%, got ${data.calculation.percentageChange}`);
    assert(data.calculation.unit === 'MT', 'Expected unit MT');
    assert(data.insufficientEvidence === false, 'insufficientEvidence should be false');
    assert(data.confidence >= 0.9, `Expected confidence >= 0.9, got ${data.confidence}`);
  });

  // 6. Scenario 3: Variance Question
  await test('Scenario 3: Variance question returns deterministic target variance & achievement', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      query: 'What is the production variance against target for Q3 FY2026?'
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.calculation != null, 'Expected calculation object');
    assert(data.calculation.currentValue === 6000, `Expected actual 6000, got ${data.calculation.currentValue}`);
    assert(data.calculation.comparisonValue === 10000, `Expected target 10000, got ${data.calculation.comparisonValue}`);
    assert(data.calculation.variance === -4000, `Expected variance -4000, got ${data.calculation.variance}`);
    assert(data.calculation.achievementRate === 60, `Expected 60% achievement, got ${data.calculation.achievementRate}`);
    assert(data.insufficientEvidence === false, 'insufficientEvidence should be false');
  });

  // 7. Scenario 4: WHY Question
  await test('Scenario 4: WHY question retrieves evidence on equipment downtime or rainfall', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      query: 'Why did production decrease in Q3 FY2026?'
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    const ansLower = data.answer.toLowerCase();
    const hasDowntime = ansLower.includes('downtime') || ansLower.includes('maintenance') || ansLower.includes('haulage');
    const hasRain = ansLower.includes('rainfall') || ansLower.includes('weather') || ansLower.includes('rain');
    assert(hasDowntime || hasRain, 'Answer should cite downtime, maintenance or rainfall from recorded document');
    assert(data.citations.length > 0, 'Expected citations with page references');
    assert(data.insufficientEvidence === false, 'insufficientEvidence should be false');
  });

  // 8. Scenario 5: Insufficient Evidence Question
  await test('Scenario 5: Out-of-scope query triggers insufficient evidence (confidence = 0)', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      query: 'What was the lithium extraction volume in the Martian crater mine in 2010?'
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.insufficientEvidence === true, 'Expected insufficientEvidence to be true');
    assert(data.confidence === 0, `Expected confidence 0, got ${data.confidence}`);
    assert(data.answer.includes('Insufficient Evidence') || data.answer.includes('not contain enough information'), 'Expected insufficient evidence statement');
  });

  // 9. Scenario 6: Citations & Page References Strictness
  await test('Scenario 6: Verify citations and page references are strictly accurate without guessing', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      question: 'Summarize production achievements across Q1, Q2, and Q3 FY2026.'
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(Array.isArray(data.citations), 'citations should be an array');
    for (const c of data.citations) {
      assert(c.documentName, 'Citation must contain documentName');
      assert(c.pageNumber === 1 || c.pageNumber === 2 || c.pageNumber === null, `Unexpected pageNumber: ${c.pageNumber}`);
      assert(typeof c.similarity === 'number', 'Citation must include similarity score');
    }
  });

  // 10. History: GET /api/v1/ai-assistant/history
  let historyId;
  await test('GET /api/v1/ai-assistant/history returns conversation list', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/history',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success: true');
    assert(Array.isArray(res.data.data) && res.data.data.length > 0, 'Expected non-empty history list');
    historyId = res.data.data[0].id;
    assert(historyId != null, 'Expected history item ID');
  });

  // 11. History Detail: GET /api/v1/ai-assistant/history/:id
  await test('GET /api/v1/ai-assistant/history/:id returns full thread messages', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: `/api/v1/ai-assistant/history/${historyId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success: true');
    assert(res.data.data.id === historyId, 'ID should match');
    assert(Array.isArray(res.data.data.messages) && res.data.data.messages.length > 0, 'Expected messages');
  });

  // 12. History Access Control: Non-owner non-admin access
  let regularUserConvId;
  await test('Non-owner cannot access another user private conversation', async () => {
    // Create conversation as regular user
    const createRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/ai-assistant/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    }, {
      query: 'Hello from reviewer user'
    });
    regularUserConvId = createRes.data.data.conversationId;

    // Register second normal user
    const otherRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: `other_user_${Date.now().toString().slice(-6)}`,
      email: `other_${Date.now()}@mineintel.test`,
      password: 'OtherPass@123',
      role: 'reviewer'
    });
    const otherToken = otherRes.data.data.token;

    // Other user attempts to delete regularUserConvId
    const delRes = await request({
      hostname: HOST,
      port: PORT,
      path: `/api/v1/ai-assistant/history/${regularUserConvId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${otherToken}` }
    });

    assert(delRes.status === 403, `Expected 403 Forbidden, got ${delRes.status}`);
  });

  // 13. History Deletion: DELETE /api/v1/ai-assistant/history/:id
  await test('DELETE /api/v1/ai-assistant/history/:id deletes conversation by owner/admin', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: `/api/v1/ai-assistant/history/${regularUserConvId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success: true');

    // Confirm it's gone
    const checkRes = await request({
      hostname: HOST,
      port: PORT,
      path: `/api/v1/ai-assistant/history/${regularUserConvId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(checkRes.status === 404, `Expected 404 after deletion, got ${checkRes.status}`);
  });

  // 14. Legacy Route Compatibility: POST /api/ai-assistant/ask & GET /api/ai-assistant/conversations
  await test('Legacy routes /api/ai-assistant/ask & /api/ai-assistant/conversations succeed for React UI', async () => {
    const askRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/ai-assistant/ask',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      question: 'What is coal dispatch in Q1 FY2026?'
    });

    assert(askRes.status === 200, `Expected 200, got ${askRes.status}`);
    assert(askRes.data.answer != null, 'Legacy response must contain answer');
    assert(Array.isArray(askRes.data.sources), 'Legacy response must contain sources array');

    const convRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/ai-assistant/conversations',
      method: 'GET'
    });

    assert(convRes.status === 200, `Expected 200, got ${convRes.status}`);
    assert(Array.isArray(convRes.data), 'Expected array of conversations');
  });

  // 15. Legacy Orchestrator: POST /api/agents/orchestrate
  await test('Legacy POST /api/agents/orchestrate succeeds for React AIAssistant page', async () => {
    const orchRes = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/agents/orchestrate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      task: 'Say hello to the mining team',
      context: { source: 'ai-assistant' }
    });

    assert(orchRes.status === 200, `Expected 200, got ${orchRes.status}`);
    assert(orchRes.data.success === true, 'Expected success: true');
    assert(orchRes.data.data?.message != null, 'Expected message in data');
  });

  console.log('\n====================================================');
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
