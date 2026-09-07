const http = require('http');

function request(options) {
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
    req.end();
  });
}

async function viewChunks() {
  const loginRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.write(JSON.stringify({ username: 'vishal', password: 'miniIntel@SIH26023' }));
    req.end();
  });

  const token = loginRes.data.token;
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/knowledge-base/6a9c3872021cfa0019573628',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  console.log('CHUNKS:');
  res.data.data.chunks.forEach((c, idx) => {
    console.log(`--- CHUNK ${idx + 1} (Page ${c.pageNumber}) ---`);
    console.log(c.content);
  });
}

viewChunks().catch(console.error);
