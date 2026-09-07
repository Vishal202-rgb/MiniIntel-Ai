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

async function main() {
  // Login as admin
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'vishal', password: 'miniIntel@SIH26023' });

  const token = loginRes.data.data.token;
  console.log('Logged in successfully, token obtained');

  // Get documents
  const docsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/documents',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const docs = docsRes.data.data;
  console.log(`Found ${docs.length} documents:`);
  for (const doc of docs) {
    console.log(`- Doc ${doc.id}: ${doc.originalName || doc.filename} (status: ${doc.status})`);
    
    // Get extraction records
    const extRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/extraction/${doc.id}/records`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (extRes.data && extRes.data.data && doc.id === '6a9c3872021cfa0019573628') {
      console.log(`  Records count: ${extRes.data.data.length}`);
      extRes.data.data.forEach(r => {
        console.log(`   * ${r.parameter}: ${r.value} ${r.unit || ''} (Period: ${r.period}, Status: ${r.status}, Page: ${r.pageNumber})`);
      });
    }

    // Get KB chunks count
    const kbRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/knowledge-base/${doc.id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (kbRes.data && kbRes.data.data) {
      console.log(`  Vector chunks count: ${kbRes.data.data.totalChunks}`);
    }
  }
}

main().catch(console.error);
