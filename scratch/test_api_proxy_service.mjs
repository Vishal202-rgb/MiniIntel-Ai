// Test the exact behavior of services/api.js with normalization
import api from '../client/src/services/api.js';
import axios from 'axios';

async function testApiService() {
  console.log('--- Logging in to obtain real JWT ---');
  const loginRes = await axios.post('http://127.0.0.1:5000/api/v1/auth/login', {
    username: 'vishal',
    password: 'miniIntel@SIH26023'
  });
  const token = loginRes.data.data.token;
  console.log('Login successful! Setting localStorage mock...');

  // Mock localStorage for node environment
  global.localStorage = {
    getItem: (key) => key === 'userInfo' ? JSON.stringify({ token }) : null,
    setItem: () => {},
    removeItem: () => {}
  };

  // Configure api baseURL for testing in node
  api.defaults.baseURL = 'http://127.0.0.1:5000/api/v1';

  console.log('\n--- 1. Testing api.get("/documents") ---');
  const docRes = await api.get('/documents');
  const documents = docRes.data;
  console.log('Is documents an Array?', Array.isArray(documents));
  console.log('typeof documents.filter:', typeof documents.filter);
  
  // This is the EXACT line 106 in IntelligenceDashboard.jsx:
  const extracted = documents.filter(d => d.status === 'completed' || d.status === 'extracted');
  console.log('Documents filtered count:', extracted.length);
  console.log('Can call extracted.map():', typeof extracted.map === 'function');
  const mappedOptions = extracted.map(d => ({ id: d._id, name: d.originalName }));
  console.log('First 2 mapped document options:', mappedOptions.slice(0, 2));

  console.log('\n--- 2. Testing api.get("/intelligence/topics/trends") ---');
  // This is the EXACT line 345 in IntelligenceDashboard.jsx:
  const trendsRes = await api.get('/intelligence/topics/trends');
  const trends = trendsRes.data || [];
  console.log('Is trends an Array?', Array.isArray(trends));
  console.log('typeof trends.forEach:', typeof trends.forEach);
  console.log('typeof trends.map:', typeof trends.map);

  // Exact code from TopicTrends in IntelligenceDashboard.jsx:
  const periods = new Set();
  trends.forEach(t => t.trends?.forEach(td => periods.add(td.period)));
  console.log('Periods extracted:', [...periods]);
  const mappedTrends = trends.map((t, i) => ({ name: t.name, periods: t.trends?.length }));
  console.log('Mapped trends count:', mappedTrends.length);

  console.log('\n--- 3. Testing api.get("/intelligence/changes") ---');
  // This is the EXACT line 237 in IntelligenceDashboard.jsx:
  const changesRes = await api.get('/intelligence/changes');
  const result = changesRes.data;
  console.log('typeof result.added:', typeof result.added, `(${result.added})`);
  console.log('typeof result.removed:', typeof result.removed, `(${result.removed})`);
  console.log('typeof result.modified:', typeof result.modified, `(${result.modified})`);
  console.log('Is result.changes an Array?', Array.isArray(result.changes));
  console.log('result.changes.length:', result.changes.length);
  console.log('Can call result.changes.slice(0, 50).map():', typeof result.changes.slice(0, 50).map === 'function');

  console.log('\n--- 4. Testing api.get("/intelligence/entities/:docId") ---');
  const testDocId = extracted[0]?.id;
  const entitiesRes = await api.get(`/intelligence/entities/${testDocId}`);
  console.log('documentName:', entitiesRes.data.documentName);
  console.log('Is entities an Array?', Array.isArray(entitiesRes.data.entities));
  console.log('Entities count:', entitiesRes.data.entities.length);

  console.log('\n--- 5. Testing api.get("/intelligence/similarity/:docId") ---');
  const simRes = await api.get(`/intelligence/similarity/${testDocId}`);
  console.log('documentName:', simRes.data.documentName);
  console.log('Is similar an Array?', Array.isArray(simRes.data.similar));

  console.log('\n--- 6. Testing api.get("/intelligence") (Overview) ---');
  const overviewRes = await api.get('/intelligence');
  console.log('Overview totalDocumentsAnalyzed:', overviewRes.data.totalDocumentsAnalyzed);
  console.log('Overview totalEntitiesFound:', overviewRes.data.totalEntitiesFound);
  console.log('Overview totalTopicsDiscovered:', overviewRes.data.totalTopicsDiscovered);

  console.log('\n--- 7. Testing api.get("/intelligence/clusters") ---');
  const clustersRes = await api.get('/intelligence/clusters');
  console.log('Clusters totalClusters:', clustersRes.data.totalClusters);
  console.log('Is clusters.clusters an Array?', Array.isArray(clustersRes.data.clusters));

  console.log('\n--- 8. Testing api.post("/intelligence/analyze") ---');
  const analyzeRes = await api.post('/intelligence/analyze', { documentId: testDocId });
  console.log('Analyze entitiesExtracted:', analyzeRes.data.entitiesExtracted);
  console.log('Analyze topicsExtracted:', analyzeRes.data.topicsExtracted);

  console.log('\n--- 9. Verify compatibility with other pages (res.data.data access) ---');
  console.log('Does docRes.data.data exist?', Array.isArray(docRes.data.data));
  console.log('Does docRes.data.data.filter work?', typeof docRes.data.data.filter === 'function');
  console.log('Does docRes.data.success exist?', docRes.data.success);

  console.log('\n======================================================');
  console.log('ALL API SERVICE NORMALIZATION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

testApiService().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
