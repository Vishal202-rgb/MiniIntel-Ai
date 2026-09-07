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

async function checkIntel() {
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'vishal', password: 'miniIntel@SIH26023' });
  const token = loginRes.data.data.token;

  // Check legacy topics
  const topicsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/topics',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Legacy topics count:', topicsRes.data.data?.length);

  // Check legacy intelligence
  const trendsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/topics/trends',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Legacy intelligence topic trends:', trendsRes.data);
}

checkIntel().catch(console.error);
