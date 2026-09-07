const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('FRONTEND REST API v1 MIGRATION TEST SUITE');
  console.log('====================================================\n');

  const results = [];
  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      results.push({ name, pass: true });
    } else {
      console.error(`  ❌ [FAIL] ${name} ${extra}`);
      results.push({ name, pass: false, error: extra });
    }
  }

  try {
    // 1. Authentication (User & Admin)
    console.log('--- 1. Testing Auth APIs ---');
    const userLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testanalyst',
      password: 'Password@123'
    });
    assert('User Login (/auth/login)', userLoginRes.data?.success && userLoginRes.data?.data?.token);
    const userToken = userLoginRes.data.data.token;
    const userClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'vishal',
      password: 'miniIntel@SIH26023'
    });
    assert('Admin Login (/auth/login)', adminLoginRes.data?.success && adminLoginRes.data?.data?.token);
    const adminToken = adminLoginRes.data.data.token;
    const adminClient = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const meRes = await userClient.get('/auth/me');
    assert('Get Current User (/auth/me)', meRes.data?.success && meRes.data?.data?.username === 'testanalyst');

    // 2. Dashboard APIs
    console.log('\n--- 2. Testing Dashboard APIs ---');
    const dashOverview = await userClient.get('/dashboard/overview');
    assert('Dashboard Overview (/dashboard/overview)', dashOverview.data?.success);

    const dashKpis = await userClient.get('/dashboard/kpis');
    assert('Dashboard KPIs (/dashboard/kpis)', dashKpis.data?.success);

    const dashActivity = await userClient.get('/dashboard/activity');
    assert('Dashboard Activity (/dashboard/activity)', dashActivity.data?.success);

    const dashAlerts = await userClient.get('/dashboard/alerts');
    assert('Dashboard Alerts (/dashboard/alerts)', dashAlerts.data?.success);

    const dashRecent = await userClient.get('/dashboard/recent-documents');
    assert('Dashboard Recent Documents (/dashboard/recent-documents)', dashRecent.data?.success);

    // 3. Command Centre APIs
    console.log('\n--- 3. Testing Command Centre APIs ---');
    const ccOverview = await userClient.get('/command-centre/overview');
    assert('Command Centre Overview (/command-centre/overview)', ccOverview.data?.success);

    const ccPipeline = await userClient.get('/command-centre/pipeline');
    assert('Command Centre Pipeline (/command-centre/pipeline)', ccPipeline.data?.success);

    const ccStatus = await userClient.get('/command-centre/status');
    assert('Command Centre Status (/command-centre/status)', ccStatus.data?.success);

    const ccAttention = await userClient.get('/command-centre/attention-items');
    assert('Command Centre Attention Items (/command-centre/attention-items)', ccAttention.data?.success);

    const ccActivity = await userClient.get('/command-centre/activity');
    assert('Command Centre Activity (/command-centre/activity)', ccActivity.data?.success);

    // 4. Documents & Extraction APIs
    console.log('\n--- 4. Testing Document & Extraction APIs ---');
    const docsRes = await adminClient.get('/documents');
    assert('List Documents (/documents)', docsRes.data?.success && Array.isArray(docsRes.data?.data));
    const allDocs = docsRes.data.data;
    const testDoc = allDocs.find(d => d._id === '6a9c3872021cfa0019573628') || allDocs[0];
    assert('Found Test Document', !!testDoc, `ID: ${testDoc?._id}`);

    if (testDoc) {
      const docDetail = await adminClient.get(`/documents/${testDoc._id}`);
      assert('Get Document By ID (/documents/:id)', docDetail.data?.success);

      const docMeta = await adminClient.get(`/documents/${testDoc._id}/metadata`);
      assert('Get Document Metadata (/documents/:id/metadata)', docMeta.data?.success);

      const docStatus = await adminClient.get(`/documents/${testDoc._id}/status`);
      assert('Get Document Status (/documents/:id/status)', docStatus.data?.success);

      const extractionRes = await adminClient.get(`/extraction/${testDoc._id}`);
      assert('Get Extraction Overview (/extraction/:documentId)', extractionRes.data?.success);

      const recordsRes = await adminClient.get(`/extraction/${testDoc._id}/records`);
      assert('Get Extraction Records (/extraction/:documentId/records)', recordsRes.data?.success);
      const records = recordsRes.data.data || [];
      console.log(`     Records count: ${records.length}`);

      if (records.length > 0) {
        const firstRecord = records[0];
        const updateRec = await adminClient.put(`/extraction/${testDoc._id}/records/${firstRecord._id}`, {
          value: firstRecord.value
        });
        assert('Update Extracted Record (/extraction/:docId/records/:recId)', updateRec.data?.success);

        const bulkApprove = await adminClient.post('/extraction/records/bulk-approve', {
          ids: [firstRecord._id]
        });
        assert('Bulk Approve Records (/extraction/records/bulk-approve)', bulkApprove.data?.success);
      }
    }

    // 5. Validation APIs
    console.log('\n--- 5. Testing Validation APIs ---');
    if (testDoc) {
      const valOverview = await adminClient.get(`/validation/${testDoc._id}`);
      assert('Get Validation by Document (/validation/:documentId)', valOverview.data?.success);

      const valIssues = await adminClient.get(`/validation/${testDoc._id}/issues`);
      assert('Get Validation Issues (/validation/:documentId/issues)', valIssues.data?.success);

      const valSummary = await adminClient.get('/validation/summary');
      assert('Get Validation Summary (/validation/summary)', valSummary.data?.success);
    }

    // 6. Knowledge Base & RAG APIs
    console.log('\n--- 6. Testing Knowledge Base & RAG APIs ---');
    const kbRes = await adminClient.get('/knowledge-base');
    assert('List Knowledge Base (/knowledge-base)', kbRes.data?.success);

    const searchRes = await adminClient.post('/knowledge-base/search', {
      query: 'coal production volume',
      limit: 3
    });
    assert('Knowledge Base Semantic Search (/knowledge-base/search)', searchRes.data?.success);

    // 7. AI Assistant APIs
    console.log('\n--- 7. Testing AI Assistant APIs ---');
    const aiAsk = await adminClient.post('/ai-assistant/ask', {
      query: 'What is the coal production recorded in test documents?'
    });
    assert('AI Assistant Ask (/ai-assistant/ask)', aiAsk.data?.success);

    const aiHistory = await adminClient.get('/ai-assistant/history');
    assert('AI Assistant History (/ai-assistant/history)', aiHistory.data?.success);

    const orchestrateRes = await adminClient.post('/agents/orchestrate', {
      task: 'Summarize recent mining production',
      context: { source: 'test' }
    });
    assert('Multi-Agent Orchestrator (/agents/orchestrate)', orchestrateRes.data?.success);

    // 8. Analytics APIs
    console.log('\n--- 8. Testing Analytics APIs ---');
    const analyticsOverview = await adminClient.get('/analytics/overview');
    assert('Analytics Overview (/analytics/overview)', analyticsOverview.data?.success);

    const analyticsKpis = await adminClient.get('/analytics/kpis');
    assert('Analytics KPIs (/analytics/kpis)', analyticsKpis.data?.success);

    const analyticsProd = await adminClient.get('/analytics/production');
    assert('Analytics Production (/analytics/production)', analyticsProd.data?.success);

    const analyticsDisp = await adminClient.get('/analytics/dispatch');
    assert('Analytics Dispatch (/analytics/dispatch)', analyticsDisp.data?.success);

    const analyticsTrends = await adminClient.get('/analytics/trends');
    assert('Analytics Trends (/analytics/trends)', analyticsTrends.data?.success);

    const analyticsVariance = await adminClient.get('/analytics/variance');
    assert('Analytics Variance (/analytics/variance)', analyticsVariance.data?.success);

    const analyticsAnomalies = await adminClient.get('/analytics/anomalies');
    assert('Analytics Anomalies (/analytics/anomalies)', analyticsAnomalies.data?.success);

    const analyticsDash = await adminClient.get('/analytics/dashboard');
    assert('Analytics Dashboard (/analytics/dashboard)', analyticsDash.data?.success);

    // 9. Intelligence & Topics APIs
    console.log('\n--- 9. Testing Intelligence & Topics APIs ---');
    const intelRes = await adminClient.get('/intelligence');
    assert('Intelligence Overview (/intelligence)', intelRes.data?.success);

    const intelTrends = await adminClient.get('/intelligence/trends');
    assert('Intelligence Trends (/intelligence/trends)', intelTrends.data?.success);

    const intelEntities = await adminClient.get('/intelligence/entities');
    assert('Intelligence Entities (/intelligence/entities)', intelEntities.data?.success);

    const intelClusters = await adminClient.get('/intelligence/clusters');
    assert('Intelligence Clusters (/intelligence/clusters)', intelClusters.data?.success);

    const topicsRes = await adminClient.get('/topics');
    assert('Topics Overview (/topics)', topicsRes.data?.success);

    const topicsTrends = await adminClient.get('/topics/trends');
    assert('Topics Trends (/topics/trends)', topicsTrends.data?.success);

    // 10. Reports, Reviews & Exports
    console.log('\n--- 10. Testing Reports, Reviews & Exports APIs ---');
    const reportsList = await adminClient.get('/reports');
    assert('List Reports (/reports)', reportsList.data?.success);
    const existingReports = reportsList.data.data || [];
    let reportToTest = existingReports[0];

    if (!reportToTest) {
      const genRes = await adminClient.post('/reports/generate', {
        title: 'Automated Migration Test Report',
        type: 'Executive Summary',
        data: { instructions: 'Test report generation' }
      });
      assert('Generate Report (/reports/generate)', genRes.data?.success);
      reportToTest = genRes.data.data;
    }

    if (reportToTest) {
      const repEvidence = await adminClient.get(`/reports/${reportToTest._id}/evidence`);
      assert('Get Report Evidence (/reports/:id/evidence)', repEvidence.data?.success);

      const repVersions = await adminClient.get(`/reports/${reportToTest._id}/version-history`);
      assert('Get Report Version History (/reports/:id/version-history)', repVersions.data?.success);

      // Dedicated exports
      const exportJson = await adminClient.get(`/reports/${reportToTest._id}/export/json`);
      assert('Export Report JSON (/reports/:id/export/json)', exportJson.status === 200);

      const exportCsv = await adminClient.get(`/reports/${reportToTest._id}/export/csv`);
      assert('Export Report CSV (/reports/:id/export/csv)', exportCsv.status === 200);

      // Reviews API
      const reviewsPending = await adminClient.get('/reviews/pending');
      assert('Get Pending Reviews (/reviews/pending)', reviewsPending.data?.success);

      // Submit & Approve review flow on a fresh draft
      const draftForApproval = await adminClient.post('/reports/generate', {
        title: 'Draft For Approval Test',
        type: 'Executive Summary',
        data: { instructions: 'Test approval flow' }
      });
      if (draftForApproval.data?.data?._id) {
        const draftId = draftForApproval.data.data._id;
        const submitRes = await adminClient.post(`/reports/${draftId}/submit-review`);
        assert('Submit Report for Review (/reports/:id/submit-review)', submitRes.data?.success);

        // Approve review (Admin)
        const approveRes = await adminClient.post(`/reviews/${draftId}/approve`);
        assert('Approve Review (/reviews/:id/approve)', approveRes.data?.success);
      }

      // Rejection workflow on a fresh draft
      const genDraft = await adminClient.post('/reports/generate', {
        title: 'Draft For Rejection Test',
        type: 'Executive Summary',
        data: { instructions: 'Test rejection flow' }
      });
      if (genDraft.data?.data?._id) {
        await adminClient.post(`/reports/${genDraft.data.data._id}/submit-review`);
        const rejectRes = await adminClient.post(`/reviews/${genDraft.data.data._id}/reject`, {
          comments: 'Insufficient evidence provided for assertions'
        });
        assert('Reject Review with Comments (/reviews/:id/reject)', rejectRes.data?.success);
      }
    }

    // 11. Audit Trail APIs
    console.log('\n--- 11. Testing Audit Trail APIs ---');
    const auditLogs = await adminClient.get('/audit?limit=10');
    assert('Get Audit Logs (/audit)', auditLogs.data?.success);

    const auditStats = await adminClient.get('/audit/stats');
    assert('Get Audit Stats (/audit/stats)', auditStats.data?.success);

    // 12. User Management APIs (Admin)
    console.log('\n--- 12. Testing User Management APIs ---');
    const usersList = await adminClient.get('/admin/users');
    assert('Get Users List (/admin/users)', usersList.data?.success);

    const adminStats = await adminClient.get('/admin/stats');
    assert('Get Admin Stats (/admin/stats)', adminStats.data?.success);

    const sysHealth = await adminClient.get('/admin/system-health');
    assert('Get System Health (/admin/system-health)', sysHealth.data?.success);

    // 13. Settings APIs
    console.log('\n--- 13. Testing Settings APIs ---');
    const settingsRes = await userClient.get('/settings');
    assert('Get User Settings (/settings)', settingsRes.data?.success);

    const updateLang = await userClient.put('/settings/language', { language: 'en' });
    assert('Update Language (/settings/language)', updateLang.data?.success);

    const updateTheme = await userClient.put('/settings/appearance', { theme: 'light' });
    assert('Update Appearance (/settings/appearance)', updateTheme.data?.success);

    const updateNotifs = await userClient.put('/settings/notifications', { emailNotif: true });
    assert('Update Notifications (/settings/notifications)', updateNotifs.data?.success);

    // 14. Help & Support APIs
    console.log('\n--- 14. Testing Help & Support APIs ---');
    const helpRes = await userClient.get('/help');
    assert('Get Help Overview (/help)', helpRes.data?.success);

    const faqsRes = await userClient.get('/help/faqs');
    assert('Get Help FAQs (/help/faqs)', faqsRes.data?.success);

    const helpSearch = await userClient.get('/help/search?q=upload');
    assert('Search Help (/help/search)', helpSearch.data?.success);

    // 15. Logout
    console.log('\n--- 15. Testing Logout ---');
    const logoutRes = await userClient.post('/auth/logout');
    assert('User Logout (/auth/logout)', logoutRes.data?.success);

  } catch (err) {
    console.error('\n❌ Unhandled Exception in Test Suite:', err.response?.data || err.message);
  }

  console.log('\n====================================================');
  const passCount = results.filter(r => r.pass).length;
  const failCount = results.filter(r => !r.pass).length;
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED, ${results.length} TOTAL`);
  console.log('====================================================\n');
}

runTests();
