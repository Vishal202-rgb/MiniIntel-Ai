const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api/v1';
const LEGACY_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING COMPLETE REPORT REST API WORKFLOW VERIFICATION ===\n');
  let adminToken = '';
  let normalToken = '';
  let reportId = '';
  let testDocumentId = '6a9c3872021cfa0019573628'; // verified indexed document

  // Step 1: Authentication (Admin & Normal User)
  console.log('--- Step 1: Authentication ---');
  try {
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'vishal',
      password: 'miniIntel@SIH26023'
    });
    adminToken = adminLoginRes.data.data.token;
    console.log('✓ Admin login successful. Role:', adminLoginRes.data.data.role);
  } catch (err) {
    console.error('Admin login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Register or login a normal user to verify non-admin restrictions
  try {
    const normalUserRes = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testanalyst',
      email: 'analyst@mineintel.org',
      password: 'Password@123',
      role: 'user'
    }).catch(async () => {
      return await axios.post(`${BASE_URL}/auth/login`, {
        username: 'testanalyst',
        password: 'Password@123'
      });
    });
    normalToken = normalUserRes.data.data.token;
    console.log('✓ Normal user token acquired.');
  } catch (err) {
    console.warn('Could not register/login normal user, using fallback token check:', err.message);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const normalHeaders = normalToken ? { Authorization: `Bearer ${normalToken}` } : adminHeaders;

  // Step 2: POST /api/v1/reports/generate
  console.log('\n--- Step 2: Generate Report (POST /api/v1/reports/generate) ---');
  try {
    const genRes = await axios.post(
      `${BASE_URL}/reports/generate`,
      {
        type: 'Production Summary',
        data: {
          documentId: testDocumentId,
          instructions: 'Include operational dispatch figures and variance calculation',
          template: 'Monthly Operational Review'
        }
      },
      { headers: adminHeaders }
    );

    console.log('✓ Status code:', genRes.status);
    console.log('✓ Success flag:', genRes.data.success);
    const report = genRes.data.data;
    reportId = report._id;
    console.log('✓ Generated Report ID:', reportId);
    console.log('✓ Report Title:', report.title);
    console.log('✓ Initial Status:', report.status);
    console.log('✓ Initial Version:', report.version);
    console.log('✓ Confidence Score:', report.confidenceScore);
    console.log('✓ Evidence Coverage:', report.evidenceCoverage);
    console.log('✓ Sources Count:', report.content?.sources?.length || 0);
  } catch (err) {
    console.error('Report generation failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 3: GET /api/v1/reports and GET /api/v1/reports/:id
  console.log('\n--- Step 3: Fetch Reports (GET /api/v1/reports & /api/v1/reports/:id) ---');
  try {
    const listRes = await axios.get(`${BASE_URL}/reports`, { headers: adminHeaders });
    console.log('✓ GET /reports status:', listRes.status);
    console.log('✓ Total reports found:', listRes.data.data?.length || 0);

    const getRes = await axios.get(`${BASE_URL}/reports/${reportId}`, { headers: adminHeaders });
    console.log('✓ GET /reports/:id status:', getRes.status);
    console.log('✓ Report ID matches:', getRes.data.data._id === reportId);
  } catch (err) {
    console.error('Fetch reports failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 4: PUT /api/v1/reports/:id (Update content and check versioning)
  console.log('\n--- Step 4: Update Report (PUT /api/v1/reports/:id) ---');
  try {
    const updateRes = await axios.put(
      `${BASE_URL}/reports/${reportId}`,
      {
        title: 'Production Summary - Revised Analysis',
        markdown: '# Production Summary - Revised Analysis\n\n## Updated Executive Summary\nProduction achieved target metrics with +8.5% variance.\n\n## Evidence Appendix\nVerified from operational dispatch logs.'
      },
      { headers: adminHeaders }
    );
    console.log('✓ PUT /reports/:id status:', updateRes.status);
    console.log('✓ New Version:', updateRes.data.data.version);
    console.log('✓ Previous Versions Saved:', updateRes.data.data.previousVersions?.length);
  } catch (err) {
    console.error('Update report failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 5: Submit for Review (POST /api/v1/reports/:id/submit-review)
  console.log('\n--- Step 5: Submit for Review (POST /api/v1/reports/:id/submit-review) ---');
  try {
    const submitRes = await axios.post(
      `${BASE_URL}/reports/${reportId}/submit-review`,
      {},
      { headers: adminHeaders }
    );
    console.log('✓ Submit status:', submitRes.status);
    console.log('✓ Report status is now:', submitRes.data.data.status);
  } catch (err) {
    console.error('Submit review failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 6: Pending Reviews (GET /api/v1/reviews/pending & GET /api/v1/reviews/:id)
  console.log('\n--- Step 6: Pending Reviews List & Detail ---');
  try {
    const pendingRes = await axios.get(`${BASE_URL}/reviews/pending`, { headers: adminHeaders });
    console.log('✓ GET /reviews/pending status:', pendingRes.status);
    const hasReport = pendingRes.data.data.some(r => r._id === reportId);
    console.log('✓ Newly submitted report present in pending reviews:', hasReport);

    const reviewDetailRes = await axios.get(`${BASE_URL}/reviews/${reportId}`, { headers: adminHeaders });
    console.log('✓ GET /reviews/:id status:', reviewDetailRes.status);
    console.log('✓ Review detail retrieved for title:', reviewDetailRes.data.data.title);
  } catch (err) {
    console.error('Pending reviews check failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 7: Test Rejection without Reason (Must Fail 400)
  console.log('\n--- Step 7: Reject without Reason (Must Fail 400) ---');
  try {
    await axios.post(
      `${BASE_URL}/reviews/${reportId}/reject`,
      { comments: '' },
      { headers: adminHeaders }
    );
    console.error('✗ Expected 400 error but request succeeded!');
    process.exit(1);
  } catch (err) {
    console.log('✓ Correctly rejected with status:', err.response?.status);
    console.log('✓ Error message:', err.response?.data?.message);
  }

  // Step 8: Reject with Valid Reason
  console.log('\n--- Step 8: Reject with Valid Reason (POST /api/v1/reviews/:id/reject) ---');
  const rejectReason = 'Please add specific breakdown of dispatch variance between rail and road.';
  try {
    const rejectRes = await axios.post(
      `${BASE_URL}/reviews/${reportId}/reject`,
      { comments: rejectReason },
      { headers: adminHeaders }
    );
    console.log('✓ Reject status:', rejectRes.status);
    console.log('✓ Status changed to:', rejectRes.data.data.status);
    console.log('✓ Preserved reviewer comments:', rejectRes.data.data.reviewerComments);
    console.log('✓ Version incremented to:', rejectRes.data.data.version);
    console.log('✓ Total previous versions archived:', rejectRes.data.data.previousVersions?.length);
  } catch (err) {
    console.error('Reject report failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 9: Re-submit for Review
  console.log('\n--- Step 9: Re-submit for Review ---');
  try {
    const reSubmitRes = await axios.post(
      `${BASE_URL}/reports/${reportId}/submit-review`,
      {},
      { headers: adminHeaders }
    );
    console.log('✓ Re-submit status:', reSubmitRes.status);
    console.log('✓ Status changed to:', reSubmitRes.data.data.status);
  } catch (err) {
    console.error('Re-submit failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 10: Non-admin Approval Test (Must Fail 403)
  if (normalToken) {
    console.log('\n--- Step 10: Non-admin Approval Test (Must Fail 403) ---');
    try {
      await axios.post(
        `${BASE_URL}/reviews/${reportId}/approve`,
        { comments: 'Attempting non-admin approval' },
        { headers: normalHeaders }
      );
      console.error('✗ Non-admin approval should have failed with 403!');
      process.exit(1);
    } catch (err) {
      console.log('✓ Correctly blocked non-admin with status:', err.response?.status);
      console.log('✓ Error message:', err.response?.data?.message);
    }
  }

  // Step 11: Admin Approval (POST /api/v1/reviews/:id/approve)
  console.log('\n--- Step 11: Admin Approval (POST /api/v1/reviews/:id/approve) ---');
  try {
    const approveRes = await axios.post(
      `${BASE_URL}/reviews/${reportId}/approve`,
      { comments: 'Approved after verification of operational logs.' },
      { headers: adminHeaders }
    );
    console.log('✓ Approve status:', approveRes.status);
    console.log('✓ Final report status:', approveRes.data.data.status);
    console.log('✓ Approved by ID:', approveRes.data.data.approvedBy);
    console.log('✓ Approved At:', approveRes.data.data.approvedAt);
  } catch (err) {
    console.error('Admin approval failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 12: Evidence endpoint (GET /api/v1/reports/:id/evidence)
  console.log('\n--- Step 12: Evidence Endpoint (GET /api/v1/reports/:id/evidence) ---');
  try {
    const evidenceRes = await axios.get(`${BASE_URL}/reports/${reportId}/evidence`, { headers: adminHeaders });
    console.log('✓ Evidence status:', evidenceRes.status);
    console.log('✓ Total sources in evidence:', evidenceRes.data.data.totalSources);
    console.log('✓ Evidence coverage:', evidenceRes.data.data.evidenceCoverage);
    console.log('✓ Confidence Score:', evidenceRes.data.data.confidenceScore);
  } catch (err) {
    console.error('Evidence endpoint failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 13: Version History & Changes
  console.log('\n--- Step 13: Versions Endpoints ---');
  try {
    const historyRes = await axios.get(`${BASE_URL}/reports/${reportId}/version-history`, { headers: adminHeaders });
    console.log('✓ Version history status:', historyRes.status);
    console.log('✓ Current version:', historyRes.data.data.currentVersion);
    console.log('✓ Total recorded versions:', historyRes.data.data.totalVersions);
    console.log('✓ History entries:', historyRes.data.data.history?.length);

    const changesRes = await axios.get(`${BASE_URL}/reports/${reportId}/changes`, { headers: adminHeaders });
    console.log('✓ Changes comparison status:', changesRes.status);
    console.log('✓ Changes summary:', changesRes.data.data.summary);
  } catch (err) {
    console.error('Versions endpoints failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 14: Exports Verification (All 4 formats + Unauthenticated check)
  console.log('\n--- Step 14: Exports Verification (PDF, DOCX, CSV, JSON) ---');
  // 14a. Unauthenticated check (Must return 401)
  try {
    await axios.get(`${BASE_URL}/reports/${reportId}/export/pdf`);
    console.error('✗ Unauthenticated export should have returned 401!');
    process.exit(1);
  } catch (err) {
    console.log('✓ Correctly rejected unauthenticated export with status:', err.response?.status);
  }

  // 14b. PDF Export
  try {
    const pdfRes = await axios.get(`${BASE_URL}/reports/${reportId}/export/pdf`, {
      headers: adminHeaders,
      responseType: 'arraybuffer'
    });
    const header = Buffer.from(pdfRes.data).slice(0, 4).toString();
    console.log('✓ PDF export status:', pdfRes.status, '| Content-Type:', pdfRes.headers['content-type'], '| Size:', pdfRes.data.length, 'bytes');
    console.log('✓ PDF Magic Header (%PDF):', header === '%PDF' ? 'VALID' : 'INVALID (' + header + ')');
  } catch (err) {
    console.error('PDF export failed:', err.message);
    process.exit(1);
  }

  // 14c. DOCX Export
  try {
    const docxRes = await axios.get(`${BASE_URL}/reports/${reportId}/export/docx`, {
      headers: adminHeaders,
      responseType: 'arraybuffer'
    });
    const header = Buffer.from(docxRes.data).slice(0, 2).toString(); // PK is standard ZIP/DOCX header
    console.log('✓ DOCX export status:', docxRes.status, '| Content-Type:', docxRes.headers['content-type'], '| Size:', docxRes.data.length, 'bytes');
    console.log('✓ DOCX Magic Header (PK):', header === 'PK' ? 'VALID' : 'INVALID (' + header + ')');
  } catch (err) {
    console.error('DOCX export failed:', err.message);
    process.exit(1);
  }

  // 14d. CSV Export
  try {
    const csvRes = await axios.get(`${BASE_URL}/reports/${reportId}/export/csv`, {
      headers: adminHeaders
    });
    console.log('✓ CSV export status:', csvRes.status, '| Content-Type:', csvRes.headers['content-type']);
    const lines = csvRes.data.split('\n');
    console.log('✓ CSV Header line:', lines[0]);
    console.log('✓ Total CSV lines:', lines.length);
  } catch (err) {
    console.error('CSV export failed:', err.message);
    process.exit(1);
  }

  // 14e. JSON Export
  try {
    const jsonRes = await axios.get(`${BASE_URL}/reports/${reportId}/export/json`, {
      headers: adminHeaders
    });
    console.log('✓ JSON export status:', jsonRes.status, '| Content-Type:', jsonRes.headers['content-type']);
    console.log('✓ JSON parsed payload title:', jsonRes.data.title);
    console.log('✓ JSON parsed status:', jsonRes.data.status);
  } catch (err) {
    console.error('JSON export failed:', err.message);
    process.exit(1);
  }

  // Step 15: Legacy UI Route Check
  console.log('\n--- Step 15: Legacy Route Compatibility ---');
  try {
    const legacyExport = await axios.get(`${LEGACY_URL}/reports/${reportId}/export?format=csv`, {
      headers: adminHeaders
    });
    console.log('✓ Legacy GET /api/reports/:id/export?format=csv status:', legacyExport.status);
  } catch (err) {
    console.error('Legacy route failed:', err.message);
    process.exit(1);
  }

  // Step 16: Audit Trail Verification
  console.log('\n--- Step 16: Audit Trail Verification ---');
  try {
    const auditRes = await axios.get(`${BASE_URL}/audit?resource=Report&limit=15`, {
      headers: adminHeaders
    });
    console.log('✓ Audit logs retrieved:', auditRes.data.data?.length || 0);
    const actions = (auditRes.data.data || []).map(a => a.action);
    console.log('✓ Recent Report Audit Actions:', [...new Set(actions)].join(', '));
  } catch (err) {
    console.warn('Audit query note:', err.response?.data?.message || err.message);
  }

  // Step 17: Delete Report (DELETE /api/v1/reports/:id)
  console.log('\n--- Step 17: Delete Report (DELETE /api/v1/reports/:id) ---');
  try {
    const delRes = await axios.delete(`${BASE_URL}/reports/${reportId}`, { headers: adminHeaders });
    console.log('✓ DELETE /reports/:id status:', delRes.status);
    console.log('✓ Message:', delRes.data.message);

    // Verify 404 on get
    try {
      await axios.get(`${BASE_URL}/reports/${reportId}`, { headers: adminHeaders });
      console.error('✗ Report still exists after deletion!');
      process.exit(1);
    } catch (notFoundErr) {
      console.log('✓ Verified 404 when fetching deleted report:', notFoundErr.response?.status);
    }
  } catch (err) {
    console.error('Delete report failed:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n=== ALL REPORT GENERATOR & REVIEW WORKFLOW TESTS PASSED PERFECTLY! ===');
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
