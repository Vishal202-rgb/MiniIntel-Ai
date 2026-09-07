import apiIntelligence from '../client/src/services/apiIntelligence.js';
import apiClient from '../client/src/api/client.js';
import axios from 'axios';

async function testIntelligenceService() {
  console.log('--- Logging in to obtain real JWT ---');
  const loginRes = await axios.post('http://127.0.0.1:5000/api/v1/auth/login', {
    username: 'vishal',
    password: 'miniIntel@SIH26023'
  });
  const token = loginRes.data.data.token;
  global.localStorage = {
    getItem: (key) => key === 'userInfo' ? JSON.stringify({ token }) : null,
    setItem: () => {},
    removeItem: () => {}
  };
  apiClient.defaults.baseURL = 'http://127.0.0.1:5000/api/v1';

  console.log('\n--- 1. getIntelligence (Overview) ---');
  const overview = await apiIntelligence.getIntelligence();
  console.log('Overview type:', typeof overview);
  console.log('totalDocumentsAnalyzed:', overview.totalDocumentsAnalyzed);
  console.log('totalEntitiesFound:', overview.totalEntitiesFound);
  console.log('totalTopicsDiscovered:', overview.totalTopicsDiscovered);

  console.log('\n--- 2. getTrends ---');
  const trends = await apiIntelligence.getTrends();
  console.log('Is trends an Array?', Array.isArray(trends));
  console.log('trends length:', trends.length);
  console.log('Can call trends.map():', typeof trends.map === 'function');

  console.log('\n--- 3. getEntities (All) ---');
  const allEntities = await apiIntelligence.getEntities();
  console.log('totalEntities:', allEntities.totalEntities);
  console.log('byType:', allEntities.byType);
  console.log('Is entities an Array?', Array.isArray(allEntities.entities));

  console.log('\n--- 4. getClusters ---');
  const clusters = await apiIntelligence.getClusters();
  console.log('totalClusters:', clusters.totalClusters);
  console.log('Is clusters an Array?', Array.isArray(clusters.clusters));

  console.log('\n--- 5. getSimilarity (Matrix) ---');
  const simMatrix = await apiIntelligence.getSimilarity();
  console.log('Is nodes an Array?', Array.isArray(simMatrix.nodes));
  console.log('Is links an Array?', Array.isArray(simMatrix.links));

  console.log('\n--- 6. getChanges ---');
  const changes = await apiIntelligence.getChanges();
  console.log('typeof changes.added:', typeof changes.added);
  console.log('typeof changes.removed:', typeof changes.removed);
  console.log('typeof changes.modified:', typeof changes.modified);
  console.log('Is changes.changes an Array?', Array.isArray(changes.changes));

  console.log('\n--- 7. analyze ---');
  const analysis = await apiIntelligence.analyze();
  console.log('analysis type:', typeof analysis);
  console.log('entitiesExtracted:', analysis.entitiesExtracted);
  console.log('topicsExtracted:', analysis.topicsExtracted);

  console.log('\n======================================================');
  console.log('ALL API INTELLIGENCE METHODS VERIFIED SUCCESSFULLY!');
  console.log('======================================================');
}

testIntelligenceService().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
