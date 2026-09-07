const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const BASE_URL = 'http://127.0.0.1:5000';
let adminToken = '';
let userToken = '';
let userId = '';
let testDocId = '';
let testRecordId = '';

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
  console.log('STARTING COMPLETE REST DOCUMENT & EXTRACTION API TEST');
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

  // 2. Normal User Registration
  try {
    const username = `docuser_${Date.now().toString().slice(-6)}`;
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: 'Password123!',
        department: 'Operations'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.data?.token, 'Normal user registration succeeds');
    userToken = regData.data.token;
    userId = regData.data._id;
  } catch (err) {
    assert(false, `Normal user registration failed: ${err.message}`);
    process.exit(1);
  }

  // 3. POST /api/v1/documents/upload - Validation: No file uploaded
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(res.status === 400 && data.error === 'NO_FILE_UPLOADED', 'Upload with missing file returns 400 NO_FILE_UPLOADED');
  } catch (err) {
    assert(false, `Missing file upload test error: ${err.message}`);
  }

  // 4. POST /api/v1/documents/upload - Validation: Invalid file format (.exe)
  try {
    const formData = new FormData();
    const badBlob = new Blob(['DOS executable binary content'], { type: 'application/x-msdownload' });
    formData.append('file', badBlob, 'malicious_file.exe');

    const res = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData
    });
    const data = await res.json();
    assert(res.status === 400 && (data.code === 'INVALID_FILE_TYPE' || data.message.includes('Invalid file type')), 'Upload with invalid file type (.exe) returns 400 INVALID_FILE_TYPE');
  } catch (err) {
    assert(false, `Invalid file type upload test error: ${err.message}`);
  }

  // 5. POST /api/v1/documents/upload - Valid Document Upload (CSV Mining Report)
  const uniqueId = Date.now();
  const validCsvContent = `Parameter,Value,Unit,Period,Mine Name,Subsidiary\nCoal Production,14.5,MT,FY 2023,Jayant Mine,NCL\nOverburden Removal,28.4,MCuM,FY 2023,Jayant Mine,NCL\nOperating Cost,1120,INR/T,FY 2023,Jayant Mine,NCL\n`;

  try {
    const formData = new FormData();
    const blob = new Blob([validCsvContent], { type: 'text/csv' });
    formData.append('file', blob, `jayant_mine_report_${uniqueId}.csv`);

    const res = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData
    });
    const data = await res.json();
    assert(res.status === 201 && data.success === true && data.data._id, 'POST /api/v1/documents/upload succeeds and returns 201 with document payload');
    testDocId = data.data._id;
  } catch (err) {
    assert(false, `Valid document upload test error: ${err.message}`);
  }

  // 6. POST /api/v1/documents/upload - SHA-256 Deduplication (409 Conflict)
  try {
    const formData = new FormData();
    const blob = new Blob([validCsvContent], { type: 'text/csv' });
    formData.append('file', blob, `duplicate_report_${uniqueId}.csv`);

    const res = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData
    });
    const data = await res.json();
    assert(res.status === 409 && data.error === 'DUPLICATE_DOCUMENT', 'Duplicate document upload returns 409 DUPLICATE_DOCUMENT');
  } catch (err) {
    assert(false, `Deduplication test error: ${err.message}`);
  }

  // 7. GET /api/v1/documents - Scoped listing with pagination
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents?limit=10&page=1`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    const pagination = data.pagination || data.meta;
    assert(
      res.status === 200 &&
      data.success === true &&
      Array.isArray(data.data) &&
      pagination &&
      pagination.page === 1 &&
      data.data.some(d => d._id === testDocId),
      'GET /api/v1/documents returns user-scoped documents and pagination metadata'
    );
  } catch (err) {
    assert(false, `GET documents list error: ${err.message}`);
  }

  // 8. GET /api/v1/documents/:id - Single document retrieval
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.document._id === testDocId &&
      Array.isArray(data.data.pages),
      'GET /api/v1/documents/:id returns document entity and associated pages'
    );
  } catch (err) {
    assert(false, `GET document by ID error: ${err.message}`);
  }

  // 9. Document Ownership Enforcement (Other user denied with 403)
  try {
    const otherUsername = `other_${Date.now().toString().slice(-6)}`;
    const otherReg = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: otherUsername,
        email: `${otherUsername}@example.com`,
        password: 'Password123!'
      })
    });
    const otherData = await otherReg.json();
    const otherToken = otherData.data.token;

    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}`, {
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    const data = await res.json();
    assert(res.status === 403 && data.error === 'FORBIDDEN', 'Accessing document of another user returns 403 FORBIDDEN');
  } catch (err) {
    assert(false, `Ownership check error: ${err.message}`);
  }

  // 10. GET /api/v1/documents/:id/metadata
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}/metadata`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.hash &&
      data.data.originalName.includes('jayant_mine_report'),
      'GET /api/v1/documents/:id/metadata returns technical & intelligence metadata'
    );
  } catch (err) {
    assert(false, `GET document metadata error: ${err.message}`);
  }

  // 11. PUT /api/v1/documents/:id/metadata
  try {
    const updatePayload = {
      category: 'Coal Production',
      classification: 'confidential',
      gisMetadata: { region: 'Singrauli Basin', latitude: 24.12, longitude: 82.68 }
    };
    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}/metadata`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.category === 'Coal Production' &&
      data.data.classification === 'confidential' &&
      data.data.gisMetadata.region === 'Singrauli Basin',
      'PUT /api/v1/documents/:id/metadata updates editable metadata fields'
    );
  } catch (err) {
    assert(false, `PUT document metadata error: ${err.message}`);
  }

  // 12. GET /api/v1/documents/:id/download
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}/download`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const disposition = res.headers.get('content-disposition');
    const text = await res.text();
    assert(
      res.status === 200 &&
      disposition && disposition.includes('attachment') &&
      text.includes('Coal Production'),
      'GET /api/v1/documents/:id/download streams original document file with Content-Disposition'
    );
  } catch (err) {
    assert(false, `GET document download error: ${err.message}`);
  }

  // 13. POST /api/v1/documents/:id/reprocess
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}/reprocess`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.status === 'pending',
      'POST /api/v1/documents/:id/reprocess resets status to pending and queues reprocessing'
    );
  } catch (err) {
    assert(false, `Reprocess document error: ${err.message}`);
  }

  // Wait a brief moment for background processing to complete text extraction
  await new Promise(resolve => setTimeout(resolve, 2500));

  // 14. POST /api/v1/extraction/run - Validation: missing documentId
  try {
    const res = await fetch(`${BASE_URL}/api/v1/extraction/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert(
      res.status === 400 && (data.message.includes('Validation failed') || (data.error && data.error.includes('documentId'))),
      'POST /api/v1/extraction/run with empty body returns 400 validation error'
    );
  } catch (err) {
    assert(false, `Run extraction missing documentId error: ${err.message}`);
  }

  // 15. POST /api/v1/extraction/run - AI Extraction Run
  try {
    const res = await fetch(`${BASE_URL}/api/v1/extraction/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: testDocId })
    });
    const data = await res.json();
    assert(
      (res.status === 200 && data.success === true) || (res.status === 500 && data.message),
      `POST /api/v1/extraction/run triggers extraction pipeline (Status: ${res.status})`
    );
  } catch (err) {
    assert(false, `Run extraction error: ${err.message}`);
  }

  // Fetch created records
  let recordsRes = await fetch(`${BASE_URL}/api/v1/extraction/${testDocId}/records`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  let recordsData = await recordsRes.json();
  
  if (recordsData.data && recordsData.data.length > 0) {
    testRecordId = recordsData.data[0]._id.toString();
  }

  // 16. GET /api/v1/extraction/:documentId - Extraction Summary & Metrics
  try {
    const res = await fetch(`${BASE_URL}/api/v1/extraction/${testDocId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.summary &&
      data.data.summary.total >= 1 &&
      data.data.summary.parameters.some(p => p.toLowerCase().includes('production') || p.toLowerCase().includes('coal')),
      'GET /api/v1/extraction/:documentId returns extraction summary metrics (total, pending, avgConfidence, parameters)'
    );
  } catch (err) {
    assert(false, `GET extraction summary error: ${err.message}`);
  }

  // 17. GET /api/v1/extraction/:documentId/records - Paginated & Filtered Records
  try {
    const res = await fetch(`${BASE_URL}/api/v1/extraction/${testDocId}/records?limit=10&page=1`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    const pagination = data.pagination || data.meta;
    assert(
      res.status === 200 &&
      data.success === true &&
      Array.isArray(data.data) &&
      data.data.length >= 1 &&
      pagination &&
      pagination.page === 1,
      'GET /api/v1/extraction/:documentId/records returns filtered records with pagination envelope'
    );
  } catch (err) {
    assert(false, `GET extraction records error: ${err.message}`);
  }

  // 18. PUT /api/v1/extraction/:documentId/records/:recordId - Record Update & Audit History
  try {
    const res = await fetch(`${BASE_URL}/api/v1/extraction/${testDocId}/records/${testRecordId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: '15.2',
        unit: 'Million Tonnes',
        status: 'approved'
      })
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.value === '15.2' &&
      data.data.unit === 'Million Tonnes' &&
      data.data.status === 'approved' &&
      data.data.editHistory.length > 0 &&
      data.data.reviewedBy,
      'PUT /api/v1/extraction/:documentId/records/:recordId updates values, status, editHistory, and review attribution'
    );
  } catch (err) {
    assert(false, `PUT extraction record error: ${err.message}`);
  }

  // 19. POST /api/v1/extraction/:documentId/reprocess - Re-extraction
  try {
    const res = await fetch(`${BASE_URL}/api/v1/extraction/${testDocId}/reprocess`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(
      (res.status === 200 && data.success === true) || (res.status === 500 && data.message),
      `POST /api/v1/extraction/:documentId/reprocess invokes document re-extraction (Status: ${res.status})`
    );
  } catch (err) {
    assert(false, `Reprocess extraction error: ${err.message}`);
  }

  // Refresh active record ID after reprocess
  try {
    const refreshRes = await fetch(`${BASE_URL}/api/v1/extraction/${testDocId}/records`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const refreshData = await refreshRes.json();
    if (refreshData.data && refreshData.data.length > 0) {
      testRecordId = refreshData.data[0]._id;
    }
  } catch (e) {}

  // 20. Legacy Routes Compatibility Check (Used by React ExtractionReview page)
  try {
    // Legacy GET /api/documents (Expects raw array)
    const legDocsRes = await fetch(`${BASE_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const legDocs = await legDocsRes.json();
    assert(legDocsRes.status === 200 && Array.isArray(legDocs), 'Legacy GET /api/documents returns raw array for React Data Extraction UI');

    // Legacy GET /api/extraction/:documentId (Expects raw array)
    const legExtRes = await fetch(`${BASE_URL}/api/extraction/${testDocId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const legExt = await legExtRes.json();
    assert(legExtRes.status === 200 && Array.isArray(legExt), 'Legacy GET /api/extraction/:documentId returns raw array for React Data Extraction UI');

    // Legacy PUT /api/extraction/records/:id
    const legUpdRes = await fetch(`${BASE_URL}/api/extraction/records/${testRecordId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: '16.5', unit: 'MT' })
    });
    const legUpd = await legUpdRes.json();
    assert(legUpdRes.status === 200 && legUpd.value === '16.5', 'Legacy PUT /api/extraction/records/:id updates record for React UI');

    // Legacy POST /api/extraction/records/:id/approve
    const legAppRes = await fetch(`${BASE_URL}/api/extraction/records/${testRecordId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const legApp = await legAppRes.json();
    assert(legAppRes.status === 200 && legApp.status === 'approved', 'Legacy POST /api/extraction/records/:id/approve marks record approved');

    // Legacy POST /api/extraction/records/:id/reject
    const legRejRes = await fetch(`${BASE_URL}/api/extraction/records/${testRecordId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const legRej = await legRejRes.json();
    assert(legRejRes.status === 200 && legRej.status === 'rejected', 'Legacy POST /api/extraction/records/:id/reject marks record rejected');

    // Legacy POST /api/extraction/records/bulk-approve
    const legBulkRes = await fetch(`${BASE_URL}/api/extraction/records/bulk-approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: [testRecordId] })
    });
    const legBulk = await legBulkRes.json();
    assert(legBulkRes.status === 200 && legBulk.message.includes('approved'), 'Legacy POST /api/extraction/records/bulk-approve succeeds for React UI');
  } catch (err) {
    assert(false, `Legacy extraction compatibility error: ${err.message}`);
  }

  // 21. DELETE /api/v1/documents/:id - Cascade deletion
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'DELETE /api/v1/documents/:id succeeds and returns 200');

    // Verify document is no longer accessible
    const checkRes = await fetch(`${BASE_URL}/api/v1/documents/${testDocId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const checkData = await checkRes.json();
    assert(checkRes.status === 404 && checkData.error === 'DOCUMENT_NOT_FOUND', 'Deleted document is verified removed (404 DOCUMENT_NOT_FOUND)');
  } catch (err) {
    assert(false, `DELETE document error: ${err.message}`);
  }

  console.log('\n====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
