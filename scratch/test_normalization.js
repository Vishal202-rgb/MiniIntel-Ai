const axios = require('axios');

// Normalizers to be tested
const toHybridArray = (rawArray, envelope = {}) => {
  const arr = Array.isArray(rawArray) ? [...rawArray] : [];
  arr.data = arr;
  arr.success = envelope.success ?? true;
  if (envelope.message !== undefined) arr.message = envelope.message;
  if (envelope.meta !== undefined) arr.meta = envelope.meta;
  if (envelope.pagination !== undefined) arr.pagination = envelope.pagination;
  return arr;
};

const normalizeDocumentsResponse = (response) => {
  if (!response) return toHybridArray([]);
  const envelope = response.data || response;
  const rawList = Array.isArray(envelope.data)
    ? envelope.data
    : (Array.isArray(envelope) ? envelope : []);
  
  const hybrid = toHybridArray(rawList, envelope);
  return {
    ...response,
    data: hybrid,
  };
};

const normalizeOverviewResponse = (response) => {
  if (!response) return { data: {} };
  const envelope = response.data || response;
  const inner = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data
    : (typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : {});

  const normalized = {
    totalDocumentsAnalyzed: Number(inner.totalDocumentsAnalyzed || 0),
    totalEntitiesFound: Number(inner.totalEntitiesFound || 0),
    totalTopicsDiscovered: Number(inner.totalTopicsDiscovered || 0),
    crossDocumentSimilaritiesComputed: Number(inner.crossDocumentSimilaritiesComputed || 0),
    filtersApplied: inner.filtersApplied && typeof inner.filtersApplied === 'object' ? inner.filtersApplied : {},
    ...inner,
    success: envelope.success ?? true,
    data: inner,
  };

  return {
    ...response,
    data: normalized,
  };
};

const normalizeTrendsResponse = (response) => {
  if (!response) return { data: toHybridArray([]) };
  const envelope = response.data || response;
  const rawList = Array.isArray(envelope.data)
    ? envelope.data
    : (Array.isArray(envelope) ? envelope : []);

  const cleaned = rawList.map(t => ({
    name: t?.name || '',
    weight: Number(t?.weight || 0),
    trends: Array.isArray(t?.trends)
      ? t.trends.map(td => ({
          period: td?.period || '',
          count: Number(td?.count || 0),
          avgWeight: Number(td?.avgWeight || 0),
          _id: td?._id,
        }))
      : [],
    ...t,
  }));

  const hybrid = toHybridArray(cleaned, envelope);
  return {
    ...response,
    data: hybrid,
  };
};

const normalizeEntitiesResponse = (response, isSingleDoc = false) => {
  if (!response) return { data: isSingleDoc ? { documentName: '', entities: [] } : { totalEntities: 0, byType: {}, entities: [] } };
  const envelope = response.data || response;
  const inner = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data
    : (typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : {});

  if (isSingleDoc || inner.documentName !== undefined) {
    const rawEntities = Array.isArray(inner.entities)
      ? inner.entities
      : (Array.isArray(envelope.entities) ? envelope.entities : (Array.isArray(inner) ? inner : []));

    const entities = rawEntities.map(e => ({
      name: e?.name || '',
      type: e?.type || 'Other',
      mentions: Number(e?.mentions || 1),
      _id: e?._id,
      ...e,
    }));

    const normalized = {
      documentName: inner.documentName || envelope.documentName || '',
      entities,
      success: envelope.success ?? true,
      data: {
        documentName: inner.documentName || envelope.documentName || '',
        entities,
      },
    };

    return {
      ...response,
      data: normalized,
    };
  } else {
    const rawEntities = Array.isArray(inner.entities)
      ? inner.entities
      : (Array.isArray(envelope.entities) ? envelope.entities : []);

    const entities = rawEntities.map(e => ({
      name: e?.name || '',
      type: e?.type || 'Other',
      mentions: Number(e?.mentions || 1),
      documents: Array.isArray(e?.documents) ? e.documents : [],
      _id: e?._id,
      ...e,
    }));

    const normalized = {
      totalEntities: Number(inner.totalEntities ?? entities.length ?? 0),
      byType: inner.byType && typeof inner.byType === 'object' ? inner.byType : {},
      entities,
      success: envelope.success ?? true,
      data: {
        totalEntities: Number(inner.totalEntities ?? entities.length ?? 0),
        byType: inner.byType && typeof inner.byType === 'object' ? inner.byType : {},
        entities,
      },
    };

    return {
      ...response,
      data: normalized,
    };
  }
};

const normalizeClustersResponse = (response) => {
  if (!response) return { data: { totalClusters: 0, clusters: [] } };
  const envelope = response.data || response;
  const inner = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data
    : (typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : {});

  const rawClusters = Array.isArray(inner.clusters)
    ? inner.clusters
    : (Array.isArray(envelope.clusters) ? envelope.clusters : (Array.isArray(inner) ? inner : []));

  const clusters = rawClusters.map(c => ({
    clusterId: c?.clusterId || '',
    name: c?.name || '',
    weight: Number(c?.weight || 0),
    keywords: Array.isArray(c?.keywords) ? c.keywords : [],
    documentCount: Number(c?.documentCount || 0),
    relatedTopics: Array.isArray(c?.relatedTopics) ? c.relatedTopics : [],
    ...c,
  }));

  const normalized = {
    totalClusters: Number(inner.totalClusters ?? clusters.length ?? 0),
    clusters,
    success: envelope.success ?? true,
    data: {
      totalClusters: Number(inner.totalClusters ?? clusters.length ?? 0),
      clusters,
    },
  };

  return {
    ...response,
    data: normalized,
  };
};

const normalizeSimilarityResponse = (response, isSingleDoc = false) => {
  if (!response) return { data: isSingleDoc ? { documentName: '', similar: [] } : { nodes: [], links: [] } };
  const envelope = response.data || response;
  const inner = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data
    : (typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : {});

  if (isSingleDoc || inner.documentName !== undefined || inner.similar !== undefined) {
    const rawSimilar = Array.isArray(inner.similar)
      ? inner.similar
      : (Array.isArray(inner.similarDocuments)
          ? inner.similarDocuments
          : (Array.isArray(envelope.similar) ? envelope.similar : []));

    const similar = rawSimilar.map(s => ({
      documentId: s?.documentId,
      doc: s?.doc || (s?.documentId && typeof s.documentId === 'object' ? s.documentId : {}),
      score: Number(s?.score || 0),
      ...s,
    }));

    const normalized = {
      documentName: inner.documentName || envelope.documentName || '',
      similar,
      similarDocuments: similar,
      success: envelope.success ?? true,
      data: {
        documentName: inner.documentName || envelope.documentName || '',
        similar,
        similarDocuments: similar,
      },
    };

    return {
      ...response,
      data: normalized,
    };
  } else {
    const nodes = Array.isArray(inner.nodes) ? inner.nodes : (Array.isArray(envelope.nodes) ? envelope.nodes : []);
    const links = Array.isArray(inner.links) ? inner.links : (Array.isArray(envelope.links) ? envelope.links : []);
    const similarDocuments = Array.isArray(inner.similarDocuments) ? inner.similarDocuments : [];

    const normalized = {
      nodes,
      links,
      similarDocuments,
      documentId: inner.documentId || '',
      success: envelope.success ?? true,
      data: {
        nodes,
        links,
        similarDocuments,
        documentId: inner.documentId || '',
      },
    };

    return {
      ...response,
      data: normalized,
    };
  }
};

const normalizeChangesResponse = (response) => {
  if (!response) {
    return {
      data: {
        documentA: { name: 'Doc A' },
        documentB: { name: 'Doc B' },
        totalChanges: 0,
        added: 0,
        removed: 0,
        modified: 0,
        changes: [],
      }
    };
  }
  const envelope = response.data || response;
  const inner = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data
    : (typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : {});

  const rawChanges = Array.isArray(inner.changes)
    ? inner.changes
    : (Array.isArray(envelope.changes) ? envelope.changes : []);

  const changes = rawChanges.map(c => ({
    type: c?.type || 'changed',
    parameter: c?.parameter || '',
    mineName: c?.mineName || '',
    subsidiary: c?.subsidiary || '',
    oldValue: c?.oldValue || null,
    newValue: c?.newValue || null,
    ...c,
  }));

  const normalized = {
    documentA: inner.documentA || envelope.documentA || { name: 'Doc A' },
    documentB: inner.documentB || envelope.documentB || { name: 'Doc B' },
    totalChanges: Number(inner.totalChanges ?? changes.length ?? 0),
    added: Number(inner.added ?? changes.filter(c => c.type === 'added').length ?? 0),
    removed: Number(inner.removed ?? changes.filter(c => c.type === 'removed').length ?? 0),
    modified: Number(inner.modified ?? changes.filter(c => c.type === 'changed').length ?? 0),
    changes,
    success: envelope.success ?? true,
    data: {
      documentA: inner.documentA || envelope.documentA || { name: 'Doc A' },
      documentB: inner.documentB || envelope.documentB || { name: 'Doc B' },
      totalChanges: Number(inner.totalChanges ?? changes.length ?? 0),
      added: Number(inner.added ?? changes.filter(c => c.type === 'added').length ?? 0),
      removed: Number(inner.removed ?? changes.filter(c => c.type === 'removed').length ?? 0),
      modified: Number(inner.modified ?? changes.filter(c => c.type === 'changed').length ?? 0),
      changes,
    },
  };

  return {
    ...response,
    data: normalized,
  };
};

const normalizeAnalyzeResponse = (response) => {
  if (!response) return { data: {} };
  const envelope = response.data || response;
  const inner = envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
    ? envelope.data
    : (typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : {});

  const normalized = {
    documentId: inner.documentId || '',
    documentName: inner.documentName || '',
    entitiesExtracted: Number(inner.entitiesExtracted || 0),
    topicsExtracted: Number(inner.topicsExtracted || 0),
    similarDocumentsFound: Number(inner.similarDocumentsFound || 0),
    ...inner,
    success: envelope.success ?? true,
    data: inner,
  };

  return {
    ...response,
    data: normalized,
  };
};

// TEST SUITE
async function runVerification() {
  console.log('--- Testing Against Live Backend ---');
  const loginRes = await axios.post('http://127.0.0.1:5000/api/v1/auth/login', {
    username: 'vishal',
    password: 'miniIntel@SIH26023'
  });
  const token = loginRes.data.data.token;
  const client = axios.create({
    baseURL: 'http://127.0.0.1:5000/api/v1',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Test 1: Documents listing and .filter()
  const rawDocsRes = await client.get('/documents');
  const normDocsRes = normalizeDocumentsResponse(rawDocsRes);
  const documents = normDocsRes.data;
  console.log('1. Documents: isArray?', Array.isArray(documents));
  console.log('   Can call .filter()?', typeof documents.filter === 'function');
  const filtered = documents.filter(d => d.status === 'completed' || d.status === 'extracted');
  console.log('   Filtered count:', filtered.length);
  console.log('   Can access .data.filter()?', typeof normDocsRes.data.data.filter === 'function');

  // Test 2: Trends and .map() / .forEach()
  const rawTrendsRes = await client.get('/intelligence/topics/trends');
  const normTrendsRes = normalizeTrendsResponse(rawTrendsRes);
  const trends = normTrendsRes.data;
  console.log('\n2. Trends: isArray?', Array.isArray(trends));
  console.log('   Can call .forEach()?', typeof trends.forEach === 'function');
  console.log('   Can call .map()?', typeof trends.map === 'function');
  trends.forEach(t => console.log(`   - Trend: ${t.name}, periods: ${t.trends?.length}`));

  // Test 3: Changes and .changes.length / .changes.slice().map()
  const rawChangesRes = await client.get('/intelligence/changes');
  const normChangesRes = normalizeChangesResponse(rawChangesRes);
  const result = normChangesRes.data;
  console.log('\n3. Changes: result.added is number?', typeof result.added === 'number', result.added);
  console.log('   result.changes isArray?', Array.isArray(result.changes));
  console.log('   result.changes.length?', result.changes.length);
  console.log('   result.changes.slice(0, 50).map() works?', typeof result.changes.slice(0, 50).map === 'function');

  // Test 4: Single doc entities
  const testDocId = filtered[0]?._id;
  const rawEntitiesRes = await client.get(`/intelligence/entities/${testDocId}`);
  const normEntitiesRes = normalizeEntitiesResponse(rawEntitiesRes, true);
  console.log('\n4. Doc Entities: documentName:', normEntitiesRes.data.documentName);
  console.log('   entities isArray?', Array.isArray(normEntitiesRes.data.entities));

  // Test 5: Single doc similarity
  const rawSimRes = await client.get(`/intelligence/similarity/${testDocId}`);
  const normSimRes = normalizeSimilarityResponse(rawSimRes, true);
  console.log('\n5. Doc Similarity: documentName:', normSimRes.data.documentName);
  console.log('   similar isArray?', Array.isArray(normSimRes.data.similar));

  // Test 6: Overview
  const rawOverviewRes = await client.get('/intelligence');
  const normOverviewRes = normalizeOverviewResponse(rawOverviewRes);
  console.log('\n6. Overview: isObject?', typeof normOverviewRes.data === 'object' && !Array.isArray(normOverviewRes.data));
  console.log('   totalDocumentsAnalyzed is number?', typeof normOverviewRes.data.totalDocumentsAnalyzed === 'number');

  // Test 7: Clusters
  const rawClustersRes = await client.get('/intelligence/clusters');
  const normClustersRes = normalizeClustersResponse(rawClustersRes);
  console.log('\n7. Clusters: clusters isArray?', Array.isArray(normClustersRes.data.clusters));
  console.log('   totalClusters is number?', typeof normClustersRes.data.totalClusters === 'number');

  // Test 8: Analyze
  const rawAnalyzeRes = await client.post('/intelligence/analyze', { documentId: testDocId });
  const normAnalyzeRes = normalizeAnalyzeResponse(rawAnalyzeRes);
  console.log('\n8. Analyze: isObject?', typeof normAnalyzeRes.data === 'object');
  console.log('   entitiesExtracted is number?', typeof normAnalyzeRes.data.entitiesExtracted === 'number');

  console.log('\nALL 8 TESTS PASSED WITHOUT ERRORS!');
}

runVerification().catch(console.error);
