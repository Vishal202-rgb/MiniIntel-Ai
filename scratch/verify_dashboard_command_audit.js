const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== STARTING DASHBOARD, COMMAND CENTRE & AUDIT TRAIL VERIFICATION ===\n');

  let adminToken = '';
  let normalToken = '';
  let normalUserId = '';
  let sampleAuditId = '';
  let sampleDocId = '6a9c3872021cfa0019573628';
  let sampleReportId = '';

  // 1. Authenticate Admin and Normal User
  console.log('--- 1. Authentication & Setup ---');
  try {
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'vishal',
      password: 'miniIntel@SIH26023'
    });
    adminToken = adminLoginRes.data.data.token;
    console.log('✓ Admin login successful. Role:', adminLoginRes.data.data.role);

    const normalUserRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testanalyst',
      password: 'Password@123'
    });
    normalToken = normalUserRes.data.data.token;
    normalUserId = normalUserRes.data.data._id;
    console.log('✓ Normal user login successful. ID:', normalUserId);
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const normalHeaders = { Authorization: `Bearer ${normalToken}` };

  // Fetch an existing report for audit report test
  try {
    const repRes = await axios.get(`${BASE_URL}/reports`, { headers: adminHeaders });
    if (repRes.data.data?.length > 0) {
      sampleReportId = repRes.data.data[0]._id;
      console.log('✓ Found sample report ID for testing:', sampleReportId);
    }
  } catch (e) {
    console.warn('Could not fetch sample report:', e.message);
  }

  // ==========================================
  // DASHBOARD ENDPOINTS
  // ==========================================
  console.log('\n--- 2. Dashboard Endpoints ---');

  // 2a. GET /api/v1/dashboard/overview
  try {
    const res = await axios.get(`${BASE_URL}/dashboard/overview`, { headers: adminHeaders });
    console.log('✓ GET /dashboard/overview status:', res.status);
    console.log('  Documents:', res.data.data.documents);
    console.log('  Validation Score:', res.data.data.validation?.score);
    console.log('  Reports Count:', res.data.data.reports?.total);
    console.log('  Recent Activity Items:', res.data.data.recentActivity?.length);
  } catch (err) {
    console.error('GET /dashboard/overview failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2b. GET /api/v1/dashboard/kpis
  try {
    const res = await axios.get(`${BASE_URL}/dashboard/kpis`, { headers: adminHeaders });
    console.log('✓ GET /dashboard/kpis status:', res.status);
    console.log('  Total Docs KPI:', res.data.data.totalDocs);
    console.log('  Processed KPI:', res.data.data.processedDocs);
    console.log('  Pending KPI:', res.data.data.pendingDocs);
    console.log('  Failed KPI:', res.data.data.failedDocs);
    console.log('  Avg Extraction Confidence:', res.data.data.averageConfidenceScore?.percentage);
  } catch (err) {
    console.error('GET /dashboard/kpis failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2c. GET /api/v1/dashboard/activity
  try {
    const res = await axios.get(`${BASE_URL}/dashboard/activity?limit=5`, { headers: adminHeaders });
    console.log('✓ GET /dashboard/activity status:', res.status);
    console.log('  Activity feed count:', res.data.data?.length);
    if (res.data.data?.length > 0) {
      const top = res.data.data[0];
      console.log('  Top Activity:', top.type, '|', top.title, '|', top.timestamp);
    }
  } catch (err) {
    console.error('GET /dashboard/activity failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2d. GET /api/v1/dashboard/alerts
  try {
    const res = await axios.get(`${BASE_URL}/dashboard/alerts`, { headers: adminHeaders });
    console.log('✓ GET /dashboard/alerts status:', res.status);
    console.log('  Alerts count:', res.data.data?.length);
    if (res.data.data?.length > 0) {
      console.log('  Sample Alert:', res.data.data[0].severity, '|', res.data.data[0].title);
    }
  } catch (err) {
    console.error('GET /dashboard/alerts failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2e. GET /api/v1/dashboard/recent-documents
  try {
    const res = await axios.get(`${BASE_URL}/dashboard/recent-documents?limit=5`, { headers: adminHeaders });
    console.log('✓ GET /dashboard/recent-documents status:', res.status);
    console.log('  Recent documents count:', res.data.data?.length);
    if (res.data.data?.length > 0) {
      console.log('  First document:', res.data.data[0].originalName, '| Records count:', res.data.data[0].extractedRecordsCount);
    }
  } catch (err) {
    console.error('GET /dashboard/recent-documents failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // ==========================================
  // COMMAND CENTRE ENDPOINTS
  // ==========================================
  console.log('\n--- 3. Command Centre Endpoints ---');

  // 3a. GET /api/v1/command-centre/overview
  try {
    const res = await axios.get(`${BASE_URL}/command-centre/overview`, { headers: adminHeaders });
    console.log('✓ GET /command-centre/overview status:', res.status);
    console.log('  Docs Processed:', res.data.data.stats?.docsProcessed);
    console.log('  Validation Score:', res.data.data.stats?.validationScore);
    console.log('  Open Issues:', res.data.data.stats?.openIssues);
    console.log('  Reports Generated:', res.data.data.stats?.reportsGenerated);
  } catch (err) {
    console.error('GET /command-centre/overview failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3b. GET /api/v1/command-centre/pipeline
  try {
    const res = await axios.get(`${BASE_URL}/command-centre/pipeline`, { headers: adminHeaders });
    console.log('✓ GET /command-centre/pipeline status:', res.status);
    console.log('  Pipeline Stages:', Object.keys(res.data.data.pipelineStages));
    console.log('  Health Summary:', res.data.data.healthSummary);
  } catch (err) {
    console.error('GET /command-centre/pipeline failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3c. GET /api/v1/command-centre/status
  try {
    const res = await axios.get(`${BASE_URL}/command-centre/status`, { headers: adminHeaders });
    console.log('✓ GET /command-centre/status status:', res.status);
    console.log('  Overall Status:', res.data.data.overallStatus);
    console.log('  Database Status:', res.data.data.services?.database?.status);
    console.log('  RAG Engine Status:', res.data.data.services?.ragEngine?.status);
    console.log('  LLM Engine Status:', res.data.data.services?.llmEngine?.status);
  } catch (err) {
    console.error('GET /command-centre/status failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3d. GET /api/v1/command-centre/attention-items
  try {
    const res = await axios.get(`${BASE_URL}/command-centre/attention-items`, { headers: adminHeaders });
    console.log('✓ GET /command-centre/attention-items status:', res.status);
    console.log('  Total Attention Items:', res.data.data.totalItems);
    console.log('  High Priority Count:', res.data.data.highPriorityCount);
  } catch (err) {
    console.error('GET /command-centre/attention-items failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3e. GET /api/v1/command-centre/activity
  try {
    const res = await axios.get(`${BASE_URL}/command-centre/activity?limit=5`, { headers: adminHeaders });
    console.log('✓ GET /command-centre/activity status:', res.status);
    console.log('  Feed count:', res.data.data?.length);
  } catch (err) {
    console.error('GET /command-centre/activity failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3f. Test American spelling alias (/api/v1/command-center/*)
  try {
    const res = await axios.get(`${BASE_URL}/command-center/overview`, { headers: adminHeaders });
    console.log('✓ GET /command-center/overview (American alias) status:', res.status);
  } catch (err) {
    console.error('American spelling alias failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // ==========================================
  // AUDIT TRAIL ENDPOINTS
  // ==========================================
  console.log('\n--- 4. Audit Trail Endpoints ---');

  // 4a. GET /api/v1/audit (with pagination & filters)
  try {
    const res = await axios.get(`${BASE_URL}/audit?limit=10&page=1`, { headers: adminHeaders });
    console.log('✓ GET /audit status:', res.status);
    console.log('  Total Audit Logs in DB:', res.data.meta?.total);
    console.log('  Logs returned on page 1:', res.data.data?.length);
    if (res.data.data?.length > 0) {
      sampleAuditId = res.data.data[0]._id;
      console.log('  Sample Audit ID acquired:', sampleAuditId);
    }
  } catch (err) {
    console.error('GET /audit failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4b. GET /api/v1/audit/:id
  if (sampleAuditId) {
    try {
      const res = await axios.get(`${BASE_URL}/audit/${sampleAuditId}`, { headers: adminHeaders });
      console.log('✓ GET /audit/:id status:', res.status);
      console.log('  Audit Action:', res.data.data.action);
      console.log('  Audit Resource:', res.data.data.resource);
      console.log('  Audit Actor:', res.data.data.user?.username);
    } catch (err) {
      console.error('GET /audit/:id failed:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // 4c. GET /api/v1/audit/user/:userId
  try {
    const res = await axios.get(`${BASE_URL}/audit/user/${normalUserId}`, { headers: adminHeaders });
    console.log('✓ GET /audit/user/:userId status:', res.status);
    console.log('  Logs for normal user:', res.data.data?.length);
  } catch (err) {
    console.error('GET /audit/user/:userId failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4d. GET /api/v1/audit/document/:documentId
  try {
    const res = await axios.get(`${BASE_URL}/audit/document/${sampleDocId}`, { headers: adminHeaders });
    console.log('✓ GET /audit/document/:documentId status:', res.status);
    console.log('  Logs for document:', res.data.data?.length);
  } catch (err) {
    console.error('GET /audit/document/:documentId failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4e. GET /api/v1/audit/report/:reportId
  if (sampleReportId) {
    try {
      const res = await axios.get(`${BASE_URL}/audit/report/${sampleReportId}`, { headers: adminHeaders });
      console.log('✓ GET /audit/report/:reportId status:', res.status);
      console.log('  Logs for report:', res.data.data?.length);
    } catch (err) {
      console.error('GET /audit/report/:reportId failed:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // 4f. GET /api/v1/audit/export (CSV)
  try {
    const res = await axios.get(`${BASE_URL}/audit/export?format=csv`, { headers: adminHeaders });
    console.log('✓ GET /audit/export?format=csv status:', res.status);
    console.log('  Content-Type:', res.headers['content-type']);
    const lines = res.data.split('\n');
    console.log('  CSV Header:', lines[0]);
    console.log('  Total CSV Export Lines:', lines.length);
  } catch (err) {
    console.error('GET /audit/export (CSV) failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4g. GET /api/v1/audit/export (JSON)
  try {
    const res = await axios.get(`${BASE_URL}/audit/export?format=json`, { headers: adminHeaders });
    console.log('✓ GET /audit/export?format=json status:', res.status);
    console.log('  Content-Type:', res.headers['content-type']);
    console.log('  Exported JSON total logs:', res.data.totalLogs);
  } catch (err) {
    console.error('GET /audit/export (JSON) failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // ==========================================
  // RBAC AUDIT CHECKS
  // ==========================================
  console.log('\n--- 5. RBAC Protection Checks ---');

  // 5a. Normal user attempting to access another user's audit logs (Must return 403)
  try {
    const adminUser = '6a91d43d52168fcd016cd70c'; // admin user ID
    await axios.get(`${BASE_URL}/audit/user/${adminUser}`, { headers: normalHeaders });
    console.error('✗ Regular user accessing admin audit logs should have returned 403!');
    process.exit(1);
  } catch (err) {
    console.log('✓ Correctly rejected unauthorized user audit query with status:', err.response?.status);
    console.log('  Error message:', err.response?.data?.message);
  }

  // 5b. Unauthenticated access to dashboard overview (Must return 401)
  try {
    await axios.get(`${BASE_URL}/dashboard/overview`);
    console.error('✗ Unauthenticated access should have returned 401!');
    process.exit(1);
  } catch (err) {
    console.log('✓ Correctly rejected unauthenticated dashboard query with status:', err.response?.status);
  }

  console.log('\n=== ALL DASHBOARD, COMMAND CENTRE & AUDIT TRAIL TESTS PASSED PERFECTLY! ===');
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
