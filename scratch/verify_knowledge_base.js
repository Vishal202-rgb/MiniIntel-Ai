const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const BASE_URL = 'http://127.0.0.1:5000';
let adminToken = '';
let userToken = '';
let targetDocId = '6a9c3872021cfa0019573628';

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
  console.log('STARTING KNOWLEDGE BASE & RAG REST API TEST SUITE');
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
    const username = `kbuser_${Date.now().toString().slice(-6)}`;
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: 'Password123!',
        department: 'Geology'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.data?.token, 'Normal user registration succeeds');
    userToken = regData.data.token;
  } catch (err) {
    assert(false, `Normal user registration failed: ${err.message}`);
    process.exit(1);
  }

  // Identify eligible document for indexing
  try {
    const docsRes = await fetch(`${BASE_URL}/api/v1/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const docsData = await docsRes.json();
    const candidate = docsData.data.find(d => d.status === 'extracted' || d.status === 'completed');
    if (candidate) {
      targetDocId = candidate._id;
    }
    console.log(`Using target document for indexing: ${targetDocId}\n`);
  } catch (err) {
    console.error('Error selecting document:', err);
  }

  // 3. GET /api/v1/knowledge-base - Overview & metrics
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base?limit=10&page=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    const pagination = data.pagination || data.meta;
    assert(
      res.status === 200 &&
      data.success === true &&
      Array.isArray(data.data) &&
      pagination &&
      typeof pagination.totalVectorChunks === 'number',
      'GET /api/v1/knowledge-base lists documents with indexing status & totalVectorChunks'
    );
  } catch (err) {
    assert(false, `GET knowledge-base error: ${err.message}`);
  }

  // 4. POST /api/v1/knowledge-base/index - Validation error on empty body
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/index`, {
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
      'POST /api/v1/knowledge-base/index with missing documentId returns 400 validation error'
    );
  } catch (err) {
    assert(false, `Index validation error: ${err.message}`);
  }

  // 5. POST /api/v1/knowledge-base/index - Index target document into vector chunks
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/index`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: targetDocId })
    });
    const data = await res.json();
    assert(
      res.status === 201 &&
      data.success === true &&
      data.data.documentId === targetDocId &&
      typeof data.data.chunksIndexed === 'number' &&
      data.data.chunksIndexed > 0,
      'POST /api/v1/knowledge-base/index generates embeddings and indexes document chunks'
    );
  } catch (err) {
    assert(false, `Index document execution error: ${err.message}`);
  }

  // 6. GET /api/v1/knowledge-base/:documentId - Retrieve indexed document details & chunks
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/${targetDocId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      data.data.document._id === targetDocId &&
      data.data.chunksCount > 0 &&
      Array.isArray(data.data.chunks) &&
      data.data.chunks[0].content,
      'GET /api/v1/knowledge-base/:documentId retrieves vector chunks, page numbers, and metadata'
    );
  } catch (err) {
    assert(false, `GET document knowledge-base details error: ${err.message}`);
  }

  // 7. POST /api/v1/knowledge-base/search - Validation error on empty query
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const data = await res.json();
    assert(
      res.status === 400 && (data.message.includes('Validation failed') || (data.error && data.error.includes('query'))),
      'POST /api/v1/knowledge-base/search with missing query returns 400 validation error'
    );
  } catch (err) {
    assert(false, `Search validation error: ${err.message}`);
  }

  // 8. POST /api/v1/knowledge-base/search - Semantic vector search
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'coal production and dispatch figures',
        topK: 3
      })
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      Array.isArray(data.data.results) &&
      data.data.results.length > 0 &&
      typeof data.data.results[0].similarityScore === 'number' &&
      data.data.results[0].snippet &&
      data.data.results[0].documentName,
      'POST /api/v1/knowledge-base/search returns ranked semantic search results with source evidence'
    );
  } catch (err) {
    assert(false, `Semantic search error: ${err.message}`);
  }

  // 9. POST /api/v1/knowledge-base/search - Multi-dimensional filter (document filter)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'production target achievement',
        topK: 5,
        filters: {
          documentId: targetDocId
        }
      })
    });
    const data = await res.json();
    const allMatchDoc = data.data.results.every(r => (r.documentId?._id || r.documentId).toString() === targetDocId);
    assert(
      res.status === 200 &&
      data.success === true &&
      allMatchDoc,
      'POST /api/v1/knowledge-base/search enforces document filter scoping'
    );
  } catch (err) {
    assert(false, `Filtered search error: ${err.message}`);
  }

  // 10. Access Control - Non-owner non-admin access check
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/${targetDocId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error === 'FORBIDDEN',
      'Non-owner non-admin user is rejected with 403 FORBIDDEN when accessing another document'
    );
  } catch (err) {
    assert(false, `Access control check error: ${err.message}`);
  }

  // 11. Legacy RAG Routes Compatibility Check (Used by React KnowledgeBase.jsx)
  try {
    // Legacy POST /api/rag/search
    const legSearchRes = await fetch(`${BASE_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'coal production' })
    });
    const legResults = await legSearchRes.json();
    assert(
      legSearchRes.status === 200 &&
      Array.isArray(legResults) &&
      legResults.length > 0 &&
      typeof legResults[0].similarityScore === 'number',
      'Legacy POST /api/rag/search returns raw array of results for React KnowledgeBase UI'
    );

    // Legacy POST /api/rag/:documentId/index
    const legIndexRes = await fetch(`${BASE_URL}/api/rag/${targetDocId}/index`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const legIndexData = await legIndexRes.json();
    assert(
      legIndexRes.status === 200 &&
      legIndexData.message.includes('indexed successfully') &&
      typeof legIndexData.chunksIndexed === 'number',
      'Legacy POST /api/rag/:documentId/index succeeds for React KnowledgeBase UI'
    );
  } catch (err) {
    assert(false, `Legacy RAG compatibility error: ${err.message}`);
  }

  // 12. DELETE /api/v1/knowledge-base/:documentId - Delete document index
  try {
    const res = await fetch(`${BASE_URL}/api/v1/knowledge-base/${targetDocId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success === true &&
      typeof data.data.chunksDeleted === 'number' &&
      data.data.chunksDeleted > 0,
      'DELETE /api/v1/knowledge-base/:documentId deletes vector index chunks'
    );

    // Verify chunks are removed
    const checkRes = await fetch(`${BASE_URL}/api/v1/knowledge-base/${targetDocId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const checkData = await checkRes.json();
    assert(
      checkRes.status === 200 &&
      checkData.data.chunksCount === 0,
      'Verified document vector chunks count is now 0 after deletion'
    );
  } catch (err) {
    assert(false, `Delete index error: ${err.message}`);
  }

  // Re-index target document so system knowledge base remains intact
  try {
    await fetch(`${BASE_URL}/api/v1/knowledge-base/index`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documentId: targetDocId })
    });
  } catch (e) {}

  console.log('\n====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
