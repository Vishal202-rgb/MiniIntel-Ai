const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const BASE_URL = 'http://127.0.0.1:5000';
let adminToken = '';
let userToken = '';
let testIssueId = '';
let validDocId = '6a9c3872021cfa0019573628';
let badDataDocId = '6a91a1342c171625d7dd5d9a';

const results = [];

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    results.push({ test: message, status: 'PASS' });
  } else {
    console.error(`[FAIL] ${message}`);
    results.push({ test: message, status: 'FAIL' });
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING VALIDATION & HUMAN REVIEW REST API TEST SUITE');
  console.log('====================================================\n');

  // 1. Admin Authentication
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || 'vishal',
        password: process.env.ADMIN_PASSWORD || 'miniIntel@SIH26023'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.data?.token, 'Admin authentication succeeds');
    adminToken = adminLoginData.data.token;
  } catch (err) {
    assert(false, `Admin authentication failed: ${err.message}`);
    process.exit(1);
  }

  // 2. Normal Reviewer Registration
  try {
    const username = `reviewer_${Date.now().toString().slice(-6)}`;
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: 'Password123!',
        department: 'Quality Assurance'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.data?.token, 'Reviewer registration succeeds');
    userToken = regData.data.token;
  } catch (err) {
    assert(false, `Reviewer registration failed: ${err.message}`);
    process.exit(1);
  }

  // Confirm real existing documents
  try {
    const docsRes = await fetch(`${BASE_URL}/api/v1/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const docsData = await docsRes.json();
    const docIds = docsData.data.map(d => d._id);

    if (docIds.includes('6a91a1342c171625d7dd5d9a')) {
      badDataDocId = '6a91a1342c171625d7dd5d9a';
    } else if (docIds.length > 0) {
      badDataDocId = docIds[docIds.length - 1];
    }

    if (docIds.includes('6a9c3872021cfa0019573628')) {
      validDocId = '6a9c3872021cfa0019573628';
    } else if (docIds.length > 0) {
      validDocId = docIds[0];
    }

    console.log(`Using real documents: Valid Doc = ${validDocId}, Bad Data Doc = ${badDataDocId}\n`);
  } catch (err) {
    console.error('Error fetching existing documents:', err);
  }

  // 3. POST /api/v1/validation/run - Validation failure on empty body
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert(
      res.status === 400 && (data.message.includes('Validation failed') || (data.error && data.error.includes('documentId'))),
      'POST /api/v1/validation/run with missing documentId returns 400 validation error'
    );
  } catch (err) {
    assert(false, `Validation run missing body test error: ${err.message}`);
  }

  // 4. POST /api/v1/validation/run - On invalid/low-confidence real document
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: badDataDocId })
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.documentId === badDataDocId &&
      typeof data.data.qualityScore === 'number' &&
      data.data.bySeverity &&
      Array.isArray(data.data.issues),
      'POST /api/v1/validation/run executes rules on low-confidence/bad data document and returns quality metrics'
    );

    if (data.data.issues.length > 0) {
      testIssueId = data.data.issues[0]._id;
    }
  } catch (err) {
    assert(false, `Validation run on bad data doc error: ${err.message}`);
  }

  // 5. GET /api/v1/validation/:documentId - Complete summary for Web and Android
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/${badDataDocId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.documentId === badDataDocId &&
      data.data.documentName &&
      typeof data.data.qualityScore === 'number' &&
      typeof data.data.totalIssues === 'number' &&
      typeof data.data.openIssues === 'number' &&
      typeof data.data.avgConfidence === 'number' &&
      data.data.bySeverity &&
      data.data.byType,
      'GET /api/v1/validation/:documentId returns complete metrics and breakdown suitable for Web and Android'
    );
  } catch (err) {
    assert(false, `GET validation summary error: ${err.message}`);
  }

  // 6. GET /api/v1/validation/:documentId/issues - Filtered & paginated issues
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/${badDataDocId}/issues?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const pagination = data.pagination || data.meta;
    assert(
      res.status === 200 &&
      data.success === true &&
      Array.isArray(data.data) &&
      pagination &&
      pagination.page === 1,
      'GET /api/v1/validation/:documentId/issues returns paginated issues list'
    );

    if (!testIssueId && data.data.length > 0) {
      testIssueId = data.data[0]._id;
    }
  } catch (err) {
    assert(false, `GET document issues error: ${err.message}`);
  }

  // 7. PUT /api/v1/validation/issues/:issueId - Human Review Issue Resolution with Record Correction
  if (testIssueId) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/validation/issues/${testIssueId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'resolved',
          resolution: 'Manual review verified and corrected value',
          correctedValue: '18.5',
          notes: 'Resolved discrepancy detected during automated rule check'
        })
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
        data.success === true &&
        data.data.issue._id === testIssueId &&
        data.data.issue.status === 'resolved' &&
        data.data.issue.resolvedAt,
        'PUT /api/v1/validation/issues/:issueId resolves issue and tracks resolution timestamp'
      );
    } catch (err) {
      assert(false, `PUT issue resolution error: ${err.message}`);
    }
  } else {
    console.log('[SKIP] PUT issue resolution (No issues detected on target document)');
  }

  // 8. POST /api/v1/validation/run - On real valid document
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: validDocId })
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.documentId === validDocId &&
      data.data.qualityScore >= 0,
      'POST /api/v1/validation/run executes successfully on valid mining document'
    );
  } catch (err) {
    assert(false, `Validation run on valid doc error: ${err.message}`);
  }

  // 9. GET /api/v1/validation - Multi-document validation listing
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation?limit=20&page=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const pagination = data.pagination || data.meta;
    assert(
      res.status === 200 &&
      data.success === true &&
      Array.isArray(data.data) &&
      pagination &&
      typeof pagination.qualityScore === 'number',
      'GET /api/v1/validation lists validation results across documents with overall qualityScore'
    );
  } catch (err) {
    assert(false, `GET all validation results error: ${err.message}`);
  }

  // 10. POST /api/v1/validation/:documentId/approve - Human reviewer approves document
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/${validDocId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.documentId === validDocId &&
      data.data.status === 'approved' &&
      data.data.approvedBy,
      'POST /api/v1/validation/:documentId/approve approves document and attributes reviewer'
    );
  } catch (err) {
    assert(false, `Approve validation error: ${err.message}`);
  }

  // 11. POST /api/v1/validation/:documentId/review - Full review feedback submission
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validation/${validDocId}/review`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        decision: 'approved',
        comments: 'Verified multi-period figures against statutory mine returns'
      })
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.decision === 'approved' &&
      data.data.comments.includes('statutory mine returns') &&
      data.data.reviewedBy,
      'POST /api/v1/validation/:documentId/review completes review workflow with comments and decision'
    );
  } catch (err) {
    assert(false, `Submit document review error: ${err.message}`);
  }

  // 12. Document Ownership / Authorization Validation
  try {
    const otherUserRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `nonowner_${Date.now().toString().slice(-6)}`,
        email: `nonowner_${Date.now().toString().slice(-6)}@example.com`,
        password: 'Password123!'
      })
    });
    const otherUserData = await otherUserRes.json();
    const otherToken = otherUserData.data.token;

    // Attempt to approve admin document as non-admin user
    const res = await fetch(`${BASE_URL}/api/v1/validation/${validDocId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error === 'FORBIDDEN',
      'Non-owner non-admin user is rejected with 403 FORBIDDEN when attempting to approve'
    );
  } catch (err) {
    assert(false, `Ownership authorization check error: ${err.message}`);
  }

  // 13. Legacy Routes Compatibility Check (Used by existing React ValidationDashboard.jsx)
  try {
    // Legacy POST /api/validation/:documentId/validate
    const legValRes = await fetch(`${BASE_URL}/api/validation/${validDocId}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const legVal = await legValRes.json();
    assert(legValRes.status === 200 && legVal.message.includes('Validation completed'), 'Legacy POST /api/validation/:documentId/validate succeeds for React UI');

    // Legacy GET /api/validation/summary?documentId=...
    const legSumRes = await fetch(`${BASE_URL}/api/validation/summary?documentId=${validDocId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const legSum = await legSumRes.json();
    assert(
      legSumRes.status === 200 &&
      typeof legSum.qualityScore === 'number' &&
      legSum.bySeverity &&
      Array.isArray(legSum.issues),
      'Legacy GET /api/validation/summary returns exact format expected by React ValidationDashboard'
    );

    // Legacy PUT /api/validation/:id/resolve
    if (testIssueId) {
      const legResRes = await fetch(`${BASE_URL}/api/validation/${testIssueId}/resolve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution: 'Legacy resolved' })
      });
      const legRes = await legResRes.json();
      assert(legResRes.status === 200 && legRes.status === 'resolved', 'Legacy PUT /api/validation/:id/resolve succeeds for React UI');
    }
  } catch (err) {
    assert(false, `Legacy validation compatibility error: ${err.message}`);
  }

  console.log('\n====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
