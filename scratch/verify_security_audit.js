const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runSecurityAudit() {
  console.log('===============================================================');
  console.log('STARTING COMPREHENSIVE SECURITY & CONSISTENCY AUDIT FOR /api/v1');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  let adminToken = '';
  let adminId = '';
  let normalToken = '';
  let normalId = '';
  let adminDocId = '';

  // -------------------------------------------------------------
  // Phase 1: Authentication Setup
  // -------------------------------------------------------------
  console.log('--- Phase 1: Authentication Setup ---');
  try {
    const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'vishal',
      password: 'miniIntel@SIH26023'
    });
    adminToken = adminRes.data.data.token;
    adminId = adminRes.data.data._id;
    assert(adminToken && adminRes.data.data.role === 'admin', 'Admin authenticated with role="admin"');

    const normalRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testanalyst',
      password: 'Password@123'
    });
    normalToken = normalRes.data.data.token;
    normalId = normalRes.data.data._id;
    assert(normalToken && normalRes.data.data.role === 'user', 'Normal user authenticated with role="user"');
  } catch (err) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const normalHeaders = { Authorization: `Bearer ${normalToken}` };
  const invalidHeaders = { Authorization: 'Bearer invalid.token.payload' };

  // Find a document owned by admin for ownership tests
  try {
    const docsRes = await axios.get(`${BASE_URL}/documents`, { headers: adminHeaders });
    if (docsRes.data.data?.length > 0) {
      adminDocId = docsRes.data.data[0]._id;
    }
  } catch (err) {
    console.warn('Could not fetch admin documents:', err.message);
  }

  // -------------------------------------------------------------
  // Phase 2: Authentication Enforcement (401 on missing/invalid JWT)
  // -------------------------------------------------------------
  console.log('\n--- Phase 2: Authentication Enforcement (401 on missing/invalid JWT) ---');
  const protectedEndpoints = [
    { method: 'get', url: `${BASE_URL}/auth/me` },
    { method: 'get', url: `${BASE_URL}/documents` },
    { method: 'get', url: `${BASE_URL}/reports` },
    { method: 'get', url: `${BASE_URL}/dashboard/overview` },
    { method: 'get', url: `${BASE_URL}/command-centre/status` },
    { method: 'get', url: `${BASE_URL}/settings` },
    { method: 'get', url: `${BASE_URL}/audit` },
    { method: 'get', url: `${BASE_URL}/validation` },
    { method: 'get', url: `${BASE_URL}/knowledge-base` },
    { method: 'get', url: `${BASE_URL}/ai-assistant/history` }
  ];

  for (const ep of protectedEndpoints) {
    // 2a. Missing token -> 401
    try {
      await axios({ method: ep.method, url: ep.url });
      assert(false, `Expected 401 for unauthenticated ${ep.url}`);
    } catch (err) {
      assert(err.response?.status === 401, `Unauthenticated ${ep.url.replace(BASE_URL, '')} returns 401`);
    }

    // 2b. Invalid token -> 401
    try {
      await axios({ method: ep.method, url: ep.url, headers: invalidHeaders });
      assert(false, `Expected 401 for invalid JWT ${ep.url}`);
    } catch (err) {
      assert(err.response?.status === 401, `Invalid JWT on ${ep.url.replace(BASE_URL, '')} returns 401`);
    }
  }

  // -------------------------------------------------------------
  // Phase 3: RBAC Enforcement (403 Forbidden for insufficient role)
  // -------------------------------------------------------------
  console.log('\n--- Phase 3: RBAC Enforcement (403 for normal user on admin routes) ---');
  const adminOnlyEndpoints = [
    { method: 'get', url: `${BASE_URL}/admin/users` },
    { method: 'get', url: `${BASE_URL}/admin/stats` },
    { method: 'get', url: `${BASE_URL}/admin/system-health` }
  ];

  for (const ep of adminOnlyEndpoints) {
    try {
      await axios({ method: ep.method, url: ep.url, headers: normalHeaders });
      assert(false, `Expected 403 for normal user on ${ep.url}`);
    } catch (err) {
      assert(err.response?.status === 403, `Normal user blocked from ${ep.url.replace(BASE_URL, '')} with 403 Forbidden`);
    }
  }

  // -------------------------------------------------------------
  // Phase 4: Report Approval Authorization (Admin-only 403)
  // -------------------------------------------------------------
  console.log('\n--- Phase 4: Report Approval Authorization (Admin-only 403) ---');
  const dummyReportId = '6a9100000000000000000001';
  try {
    await axios.post(
      `${BASE_URL}/reviews/${dummyReportId}/approve`,
      { comments: 'Unauthorized approve' },
      { headers: normalHeaders }
    );
    assert(false, 'Expected 403 for non-admin on report approval');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-admin blocked from /reviews/:id/approve with 403 Forbidden');
  }

  try {
    await axios.post(
      `${BASE_URL}/reports/${dummyReportId}/approve`,
      { comments: 'Unauthorized approve' },
      { headers: normalHeaders }
    );
    assert(false, 'Expected 403 for non-admin on /reports/:id/approve');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-admin blocked from /reports/:id/approve with 403 Forbidden');
  }

  // -------------------------------------------------------------
  // Phase 5: Resource Ownership / Access Controls
  // -------------------------------------------------------------
  console.log('\n--- Phase 5: Resource Ownership & Access Controls ---');
  // 5a. Normal user accessing another user's audit logs -> 403
  try {
    await axios.get(`${BASE_URL}/audit/user/${adminId}`, { headers: normalHeaders });
    assert(false, 'Expected 403 when accessing another user\'s audit logs');
  } catch (err) {
    assert(err.response?.status === 403, 'Access to another user\'s audit log blocked with 403 Forbidden');
  }

  // 5b. Document access control (normal user cannot view admin's document if non-owner)
  if (adminDocId) {
    try {
      const docRes = await axios.get(`${BASE_URL}/documents/${adminDocId}`, { headers: normalHeaders });
      // If normal user is not owner and not admin, must return 403
      assert(false, 'Expected 403 for accessing non-owned document');
    } catch (err) {
      assert(err.response?.status === 403, 'Non-owner blocked from protected document with 403 Forbidden');
    }
  }

  // -------------------------------------------------------------
  // Phase 6: Missing Resources (404 Not Found)
  // -------------------------------------------------------------
  console.log('\n--- Phase 6: Missing Resources (404 Not Found) ---');
  const nonExistentId = '600000000000000000000000';
  const notFoundEndpoints = [
    { method: 'get', url: `${BASE_URL}/documents/${nonExistentId}` },
    { method: 'get', url: `${BASE_URL}/reports/${nonExistentId}` },
    { method: 'get', url: `${BASE_URL}/audit/${nonExistentId}` },
    { method: 'get', url: `${BASE_URL}/reviews/${nonExistentId}` },
    { method: 'get', url: `${BASE_URL}/help/faqs/nonexistent-faq-id-xyz` }
  ];

  for (const ep of notFoundEndpoints) {
    try {
      await axios({ method: ep.method, url: ep.url, headers: adminHeaders });
      assert(false, `Expected 404 for missing resource ${ep.url}`);
    } catch (err) {
      assert(err.response?.status === 404, `Missing resource on ${ep.url.replace(BASE_URL, '')} returns 404`);
    }
  }

  // -------------------------------------------------------------
  // Phase 7: Request Validation (400 Bad Request on invalid payloads)
  // -------------------------------------------------------------
  console.log('\n--- Phase 7: Request Validation (400 Bad Request on invalid payloads) ---');
  const validationTestCases = [
    {
      desc: 'Auth login missing password',
      fn: () => axios.post(`${BASE_URL}/auth/login`, { username: 'vishal' })
    },
    {
      desc: 'Report generation missing type',
      fn: () => axios.post(`${BASE_URL}/reports/generate`, {}, { headers: adminHeaders })
    },
    {
      desc: 'Settings language invalid code',
      fn: () => axios.put(`${BASE_URL}/settings/language`, { language: 'invalid_lang' }, { headers: adminHeaders })
    },
    {
      desc: 'Settings appearance invalid theme',
      fn: () => axios.put(`${BASE_URL}/settings/appearance`, { theme: 'invalid_theme' }, { headers: adminHeaders })
    },
    {
      desc: 'Invalid report reject missing reason',
      fn: () => axios.post(`${BASE_URL}/reviews/${dummyReportId}/reject`, { comments: '' }, { headers: adminHeaders })
    },
    {
      desc: 'Invalid ObjectId format on document ID',
      fn: () => axios.get(`${BASE_URL}/documents/invalid-id-string-123`, { headers: adminHeaders })
    },
    {
      desc: 'Invalid ObjectId format on report ID',
      fn: () => axios.get(`${BASE_URL}/reports/invalid-id-string-123`, { headers: adminHeaders })
    },
    {
      desc: 'Invalid ObjectId format on audit ID',
      fn: () => axios.get(`${BASE_URL}/audit/invalid-id-string-123`, { headers: adminHeaders })
    }
  ];

  for (const tc of validationTestCases) {
    try {
      await tc.fn();
      assert(false, `Expected 400 for: ${tc.desc}`);
    } catch (err) {
      assert(err.response?.status === 400, `Validation test "${tc.desc}" correctly returned 400 Bad Request`);
    }
  }

  // -------------------------------------------------------------
  // Phase 8: File Upload Security & Validation
  // -------------------------------------------------------------
  console.log('\n--- Phase 8: File Upload Security & Validation ---');
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from('echo "Malicious Script"'), {
      filename: 'malicious.sh',
      contentType: 'application/x-sh'
    });

    await axios.post(`${BASE_URL}/documents/upload`, formData, {
      headers: {
        ...adminHeaders,
        ...formData.getHeaders()
      }
    });
    assert(false, 'Expected 400 error for unsupported file type (.sh)');
  } catch (err) {
    assert(
      err.response?.status === 400,
      `Upload of unauthorized MIME type (.sh) rejected with 400 (${err.response?.data?.message || err.message})`
    );
  }

  // -------------------------------------------------------------
  // Phase 9: Secret & Credential Leakage Audit
  // -------------------------------------------------------------
  console.log('\n--- Phase 9: Secret & Credential Leakage Audit ---');
  // Check responses across multiple endpoints for password, secret, or API keys
  const endpointsToAudit = [
    `${BASE_URL}/auth/me`,
    `${BASE_URL}/admin/users`,
    `${BASE_URL}/settings`,
    `${BASE_URL}/health`,
    `${BASE_URL}/command-centre/status`
  ];

  for (const url of endpointsToAudit) {
    try {
      const res = await axios.get(url, { headers: adminHeaders });
      const rawText = JSON.stringify(res.data);

      // Check for password leak
      const hasPassword = /"password"\s*:\s*"[^"]+"/.test(rawText);
      assert(!hasPassword, `No password field exposed in ${url.replace(BASE_URL, '')}`);

      // Check for JWT secret leak
      const hasJwtSecret = rawText.includes(process.env.JWT_SECRET || 'fallback_secret') && !rawText.includes('"token"');
      assert(!hasJwtSecret, `No JWT secret exposed in ${url.replace(BASE_URL, '')}`);

      // Check for MongoDB URI leak
      const hasMongoUri = rawText.includes('mongodb+srv://') || rawText.includes('mongodb://');
      assert(!hasMongoUri, `No MongoDB URI credentials exposed in ${url.replace(BASE_URL, '')}`);

      // Check for Gemini API key leak
      const hasApiKey = rawText.includes('AIzaSy') || (process.env.LLM_API_KEY && process.env.LLM_API_KEY.length > 10 && rawText.includes(process.env.LLM_API_KEY));
      assert(!hasApiKey, `No Gemini/LLM API key exposed in ${url.replace(BASE_URL, '')}`);
    } catch (err) {
      assert(false, `Failed auditing secrets on ${url}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // Phase 10: CORS Headers Verification
  // -------------------------------------------------------------
  console.log('\n--- Phase 10: CORS Headers Verification ---');
  try {
    const corsRes = await axios.get(`${BASE_URL}/health`, {
      headers: {
        Origin: 'http://localhost:5173'
      }
    });
    assert(
      corsRes.headers['access-control-allow-origin'] === 'http://localhost:5173' ||
      corsRes.headers['access-control-allow-credentials'] === 'true',
      'CORS headers properly returned for allowed origin http://localhost:5173'
    );
  } catch (err) {
    assert(false, `CORS check failed: ${err.message}`);
  }

  console.log('\n===============================================================');
  console.log(`SECURITY AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
