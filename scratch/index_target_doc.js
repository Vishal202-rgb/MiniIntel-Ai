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

async function indexDoc() {
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'vishal', password: 'miniIntel@SIH26023' });

  const token = loginRes.data.data.token;
  console.log('Login success');

  const docId = '6a9c3872021cfa0019573628';
  console.log(`Indexing doc ${docId}...`);
  const idxRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/knowledge-base/index',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { documentId: docId });

  console.log('Index response:', JSON.stringify(idxRes.data, null, 2));
}

indexDoc().catch(console.error);
