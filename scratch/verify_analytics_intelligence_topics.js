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
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
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
  console.log('STARTING ANALYTICS, INTELLIGENCE & TOPICS REST TEST');
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

  const targetDocId = '6a9c3872021cfa0019573628';

  // =============================================
  // PART 1: ANALYTICS ENDPOINTS (7 tests)
  // =============================================
  console.log('\n--- TESTING ANALYTICS ENDPOINTS ---');

  await test('GET /api/v1/analytics/overview returns real calculations from MongoDB', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/overview',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success: true');
    const data = res.data.data;
    assert(data.totalDocuments > 0, `Expected totalDocuments > 0, got ${data.totalDocuments}`);
    assert(data.totalProduction > 0, `Expected totalProduction > 0, got ${data.totalProduction}`);
    assert(data.totalDispatch > 0, `Expected totalDispatch > 0, got ${data.totalDispatch}`);
    assert(Array.isArray(data.periods) && data.periods.length > 0, 'Expected periods array');
  });

  await test('GET /api/v1/analytics/kpis returns calculated ground truth KPIs', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/kpis',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(typeof data.totalProduction === 'string' && data.totalProduction.includes('MT'), 'totalProduction formatted with MT');
    assert(typeof data.totalDispatch === 'string' && data.totalDispatch.includes('MT'), 'totalDispatch formatted with MT');
    assert(data.openIssues !== undefined, 'openIssues defined');
  });

  await test('GET /api/v1/analytics/production returns period and mine breakdowns', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/production',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.totalProduction > 0, 'Expected totalProduction > 0');
    assert(Array.isArray(data.byPeriod) && data.byPeriod.length > 0, 'Expected byPeriod breakdown');
    assert(Array.isArray(data.byMine), 'Expected byMine breakdown');
  });

  await test('GET /api/v1/analytics/dispatch returns dispatch metrics and evacuation stats', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/dispatch',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.totalDispatch > 0, 'Expected totalDispatch > 0');
    assert(Array.isArray(data.byPeriod) && data.byPeriod.length > 0, 'Expected byPeriod array');
  });

  await test('GET /api/v1/analytics/trends computes growth rates across chronological periods', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/trends',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(Array.isArray(data.trends) && data.trends.length > 0, 'Expected trends array');
    assert(data.trends[0].trajectory !== undefined, 'Expected trajectory field in trends');
  });

  await test('GET /api/v1/analytics/variance computes target variance & achievement rates', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/variance',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(Array.isArray(data.periods) && data.periods.length > 0, 'Expected periods variance array');
    assert(data.overallAchievementRate !== undefined, 'Expected overallAchievementRate');
  });

  await test('GET /api/v1/analytics/anomalies detects statistical & period-drop anomalies', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/anomalies',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected anomalies array');
  });

  await test('Analytics query filters: GET /api/v1/analytics/overview?period=Q1 scopes data', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/analytics/overview?period=Q1',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.periods.every(p => p.period.includes('Q1')), 'All returned periods should match Q1 filter');
  });

  // =============================================
  // PART 2: INTELLIGENCE ENDPOINTS (7 tests)
  // =============================================
  console.log('\n--- TESTING INTELLIGENCE ENDPOINTS ---');

  await test('GET /api/v1/intelligence returns high-level graph summary', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.totalDocumentsAnalyzed !== undefined, 'totalDocumentsAnalyzed defined');
  });

  await test('POST /api/v1/intelligence/analyze runs extraction & discovery', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { documentId: targetDocId });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.documentId === targetDocId, 'documentId matches');
  });

  await test('GET /api/v1/intelligence/trends returns topic trend data across periods', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence/trends',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected trends array');
  });

  await test('GET /api/v1/intelligence/entities returns extracted entities grouped by type', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence/entities',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.data.data;
    assert(data.totalEntities >= 0, 'totalEntities defined');
    assert(data.byType != null, 'byType grouping defined');
    assert(Array.isArray(data.entities), 'entities array defined');
  });

  await test('GET /api/v1/intelligence/clusters returns semantic topic clusters', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence/clusters',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data.clusters), 'Expected clusters array');
  });

  await test('GET /api/v1/intelligence/similarity returns document similarity graph', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence/similarity',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data.nodes), 'Expected nodes array');
    assert(Array.isArray(res.data.data.links), 'Expected links array');
  });

  await test('GET /api/v1/intelligence/changes detects diffs between documents', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/intelligence/changes',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.totalChanges !== undefined, 'totalChanges defined');
    assert(Array.isArray(res.data.data.changes), 'changes array defined');
  });

  // =============================================
  // PART 3: TOPICS ENDPOINTS (7 tests)
  // =============================================
  console.log('\n--- TESTING TOPICS ENDPOINTS ---');

  await test('GET /api/v1/topics returns enriched topic list with document counts', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data) && res.data.data.length > 0, 'Expected topics array');
    assert(res.data.data[0].name != null, 'Topic name defined');
    assert(res.data.data[0].documentCount !== undefined, 'documentCount defined');
  });

  await test('POST /api/v1/topics/analyze executes topic discovery', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { documentId: targetDocId });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.topicsFound !== undefined, 'topicsFound defined');
  });

  await test('GET /api/v1/topics/trends returns temporal trends of topics', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics/trends',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected trends array');
  });

  await test('GET /api/v1/topics/clusters returns topic clusters & related graph', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics/clusters',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected clusters array');
  });

  await test('GET /api/v1/topics/entities returns associations between topics and entities', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics/entities',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected topic-entity array');
  });

  await test('GET /api/v1/topics/emerging identifies emerging topics with growth rates', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics/emerging',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected emerging topics array');
  });

  await test('GET /api/v1/topics/changes returns topic drift and changes across periods', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/v1/topics/changes',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Expected changes array');
  });

  // =============================================
  // PART 4: LEGACY UI COMPATIBILITY (3 tests)
  // =============================================
  console.log('\n--- TESTING LEGACY UI COMPATIBILITY ---');

  await test('Legacy GET /api/analytics/dashboard succeeds for React AnalyticsDashboard page', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.kpis != null, 'Expected kpis in data');
    assert(Array.isArray(res.data.data.productionData), 'Expected productionData in data');
  });

  await test('Legacy GET /api/intelligence/topics/trends succeeds for React IntelligenceDashboard', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/intelligence/topics/trends',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data), 'Expected array of trend topics');
  });

  await test('Legacy GET /api/topics succeeds for React TopicsExplorer page', async () => {
    const res = await request({
      hostname: HOST,
      port: PORT,
      path: '/api/topics',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success: true');
    assert(Array.isArray(res.data.data), 'Expected data array');
  });

  console.log('\n====================================================');
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
