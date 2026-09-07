const axios = require('axios');

async function testIntel() {
  console.log('Logging in...');
  const loginRes = await axios.post('http://127.0.0.1:5000/api/v1/auth/login', {
    username: 'vishal',
    password: 'miniIntel@SIH26023'
  }, { timeout: 5000 });
  const token = loginRes.data.data.token;
  console.log('Logged in successfully!');

  const client = axios.create({
    baseURL: 'http://127.0.0.1:5000/api/v1',
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000
  });

  console.log('\n--- /documents ---');
  const docsRes = await client.get('/documents');
  console.log('Docs res.data keys:', Object.keys(docsRes.data));
  console.log('Is res.data an array?', Array.isArray(docsRes.data));
  console.log('Is res.data.data an array?', Array.isArray(docsRes.data.data));
  console.log('Docs count:', docsRes.data.data?.length);

  const testDocId = docsRes.data.data[0]?._id;
  console.log('Test doc ID:', testDocId);

  console.log('\n--- /intelligence (overview) ---');
  const intelRes = await client.get('/intelligence');
  console.log('Overview res.data:', JSON.stringify(intelRes.data, null, 2));

  console.log('\n--- /intelligence/trends ---');
  const trendsRes = await client.get('/intelligence/trends');
  console.log('Trends res.data:', JSON.stringify(trendsRes.data, null, 2));

  console.log('\n--- /intelligence/topics/trends ---');
  const topicsTrendsRes = await client.get('/intelligence/topics/trends');
  console.log('Topics Trends res.data:', JSON.stringify(topicsTrendsRes.data, null, 2));

  console.log('\n--- /intelligence/entities ---');
  const entitiesRes = await client.get('/intelligence/entities');
  console.log('Entities res.data:', JSON.stringify(entitiesRes.data, null, 2));

  if (testDocId) {
    console.log(`\n--- /intelligence/entities/${testDocId} ---`);
    const docEntitiesRes = await client.get(`/intelligence/entities/${testDocId}`);
    console.log('Doc entities res.data:', JSON.stringify(docEntitiesRes.data, null, 2));

    console.log(`\n--- /intelligence/similarity/${testDocId} ---`);
    const docSimRes = await client.get(`/intelligence/similarity/${testDocId}`);
    console.log('Doc similarity res.data:', JSON.stringify(docSimRes.data, null, 2));
  }

  console.log('\n--- /intelligence/clusters ---');
  const clustersRes = await client.get('/intelligence/clusters');
  console.log('Clusters res.data:', JSON.stringify(clustersRes.data, null, 2));

  console.log('\n--- /intelligence/similarity (matrix) ---');
  const simRes = await client.get('/intelligence/similarity');
  console.log('Similarity matrix res.data:', JSON.stringify(simRes.data, null, 2));

  console.log('\n--- /intelligence/changes ---');
  const changesRes = await client.get('/intelligence/changes');
  console.log('Changes res.data:', JSON.stringify(changesRes.data, null, 2));
}

testIntel().catch(err => console.error('Error:', err.response?.data || err.message));
