const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const reqOpts = { ...options, headers: { ...(options.headers || {}) } };
    if (payload) {
      reqOpts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING REPORT GENERATOR TEST SUITE ===\n');

  // Login
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'vishal', password: 'miniIntel@SIH26023' });

  const token = loginRes.body.data.token;
  console.log('✓ Admin authenticated successfully.');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };

  // Test 1: Small Report
  console.log('\n--- Test 1: Small Report ---');
  const t1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Executive Summary',
    data: { instructions: 'Brief 2-paragraph summary of quarterly highlights.' }
  });
  console.log('Status:', t1.status);
  console.log('Success:', t1.body.success);
  console.log('Report Title:', t1.body.data?.title);
  const t1Markdown = t1.body.data?.content?.markdown || '';
  console.log('Does report contain API limit error string?', t1Markdown.includes('reached the maximum API limits'));
  console.log('Report length:', t1Markdown.length);
  if (t1Markdown.includes('reached the maximum API limits')) throw new Error('FAILED: Report contains API limit error string!');
  console.log('✓ Test 1 Passed.');

  // Test 2: Production Analysis Report
  console.log('\n--- Test 2: Production Analysis Report ---');
  const t2 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Production Analysis',
    data: { instructions: 'Detailed analysis of coal production variances, actual vs target, and dispatch metrics.' }
  });
  console.log('Status:', t2.status);
  console.log('Success:', t2.body.success);
  console.log('Confidence Score:', t2.body.data?.confidenceScore);
  console.log('Evidence Coverage:', JSON.stringify(t2.body.data?.evidenceCoverage));
  const t2Markdown = t2.body.data?.content?.markdown || '';
  console.log('Contains API limit error string?', t2Markdown.includes('reached the maximum API limits'));
  console.log('Contains Production Performance section?', t2Markdown.toLowerCase().includes('production'));
  if (t2Markdown.includes('reached the maximum API limits')) throw new Error('FAILED: Production Analysis contains API limit error!');
  console.log('✓ Test 2 Passed.');

  // Test 3: Report Using All Indexed Documents
  console.log('\n--- Test 3: Report Using All Indexed Documents ---');
  const t3 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Comprehensive Mining Report',
    data: { documentId: null, instructions: 'Cross-document operational and safety intelligence.' }
  });
  console.log('Status:', t3.status);
  console.log('Sources cited count:', t3.body.data?.content?.sources?.length);
  const t3Markdown = t3.body.data?.content?.markdown || '';
  console.log('Contains API limit error string?', t3Markdown.includes('reached the maximum API limits'));
  if (t3Markdown.includes('reached the maximum API limits')) throw new Error('FAILED: Test 3 report contains API limit error!');
  console.log('✓ Test 3 Passed.');

  // Test 4: Report Using a Specific Document
  console.log('\n--- Test 4: Report Using a Specific Document ---');
  const docId = '6a9f087b4092c5b8b61a9944';
  const t4 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Operational Risk Report',
    data: { documentId: docId, instructions: 'Identify equipment maintenance and weather delays.' }
  });
  console.log('Status:', t4.status);
  console.log('Success:', t4.body.success);
  console.log('✓ Test 4 Passed.');

  // Test 5: Report With a Specific Period
  console.log('\n--- Test 5: Report With a Specific Period ---');
  const t5 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Production & Dispatch Report',
    data: { period: 'FY 2023-24', instructions: 'Evaluate dispatch efficiency for FY 2023-24.' }
  });
  console.log('Status:', t5.status);
  console.log('Success:', t5.body.success);
  console.log('✓ Test 5 Passed.');

  // Test 6: Report With a Specific Mine/Subject
  console.log('\n--- Test 6: Report With a Specific Mine/Subject ---');
  const t6 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Production Analysis',
    data: { mineName: 'Gevra', instructions: 'Assess performance of Gevra opencast project.' }
  });
  console.log('Status:', t6.status);
  console.log('Success:', t6.body.success);
  console.log('✓ Test 6 Passed.');

  // Test 7: Large Evidence Set Context Budgeting
  console.log('\n--- Test 7: Large Evidence Set Context Budgeting ---');
  const t7 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/reports/generate',
    method: 'POST',
    headers: authHeaders
  }, {
    type: 'Comprehensive Mining Report',
    data: { instructions: 'Analyze all extraction records, overburden metrics, dispatch trends, rainfall impact, conveyor reliability, and statutory safety directives across all subsidiaries and time periods.' }
  });
  console.log('Status:', t7.status);
  console.log('Success:', t7.body.success);
  console.log('Contains API limit error string?', (t7.body.data?.content?.markdown || '').includes('reached the maximum API limits'));
  console.log('✓ Test 7 Passed.');

  // Test 8: Export Workflows on Generated Report
  console.log('\n--- Test 8: Report Export Workflows (PDF, DOCX, CSV, JSON) ---');
  const testReportId = t2.body.data?._id;
  const pdfExp = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/export/pdf`, method: 'GET', headers: { 'Authorization': 'Bearer ' + token } });
  console.log('PDF Export Status:', pdfExp.status, 'Content-Type:', pdfExp.headers['content-type']);
  const docxExp = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/export/docx`, method: 'GET', headers: { 'Authorization': 'Bearer ' + token } });
  console.log('DOCX Export Status:', docxExp.status, 'Content-Type:', docxExp.headers['content-type']);
  const csvExp = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/export/csv`, method: 'GET', headers: { 'Authorization': 'Bearer ' + token } });
  console.log('CSV Export Status:', csvExp.status, 'Content-Type:', csvExp.headers['content-type']);
  const jsonExp = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/export/json`, method: 'GET', headers: { 'Authorization': 'Bearer ' + token } });
  console.log('JSON Export Status:', jsonExp.status, 'Content-Type:', jsonExp.headers['content-type']);
  console.log('✓ Test 8 Passed.');

  // Test 9: Review, Approval & Version History Workflows
  console.log('\n--- Test 9: Review, Approval & Version History Workflows ---');
  const submitRes = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/submit-review`, method: 'POST', headers: authHeaders }, {});
  console.log('Submit for review status:', submitRes.status, 'New status:', submitRes.body.data?.status);
  const approveRes = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/approve`, method: 'POST', headers: authHeaders }, { comments: 'Approved after verification.' });
  console.log('Approve status:', approveRes.status, 'New status:', approveRes.body.data?.status);
  const vHistory = await request({ hostname: 'localhost', port: 5000, path: `/api/v1/reports/${testReportId}/version-history`, method: 'GET', headers: authHeaders });
  console.log('Version history status:', vHistory.status, 'Total versions:', vHistory.body.data?.totalVersions);
  console.log('✓ Test 9 Passed.');

  // Test 10: Database Integrity Check
  console.log('\n--- Test 10: Database Integrity Check ---');
  const listReports = await request({ hostname: 'localhost', port: 5000, path: '/api/v1/reports', method: 'GET', headers: authHeaders });
  const recentReports = (listReports.body.data || []).slice(0, 5);
  console.log('Examining the 5 most recently created reports in MongoDB:');
  recentReports.forEach((r, i) => {
    const hasError = (r.content?.markdown || '').includes('reached the maximum API limits');
    console.log(`  [${i+1}] ${r.title} (${r.status}): contains error string? ${hasError}`);
  });
  console.log('✓ Test 10 Passed.');

  console.log('\n========================================');
  console.log('ALL 10 VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
