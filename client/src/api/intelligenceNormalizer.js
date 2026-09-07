/**
 * Intelligence & Document API Response Normalization Layer
 * 
 * Ensures consistent, type-safe structures across all Intelligence endpoints:
 * - Arrays remain Arrays
 * - Objects remain Objects
 * - Numeric counters default safely to numbers
 * - Dual-access (flat and nested .data) is preserved for backward compatibility
 */

/**
 * Creates a hybrid array that functions as a true JavaScript Array
 * while also carrying envelope properties (data, success, message, meta, pagination).
 */
export const toHybridArray = (rawArray, envelope = {}) => {
  const arr = Array.isArray(rawArray) ? [...rawArray] : [];
  arr.data = arr;
  arr.success = envelope.success ?? true;
  if (envelope.message !== undefined) arr.message = envelope.message;
  if (envelope.meta !== undefined) arr.meta = envelope.meta;
  if (envelope.pagination !== undefined) arr.pagination = envelope.pagination;
  return arr;
};

/**
 * 1. Document list response normalizer (/documents)
 * Extracts the documents array into a hybrid array.
 */
export const normalizeDocumentsResponse = (response) => {
  if (!response) return { data: toHybridArray([]) };
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

/**
 * 2. Intelligence Overview response normalizer (/intelligence)
 * Ensures high-level summary counters and metadata are clean numbers and objects.
 */
export const normalizeOverviewResponse = (response) => {
  if (!response) {
    return {
      data: {
        totalDocumentsAnalyzed: 0,
        totalEntitiesFound: 0,
        totalTopicsDiscovered: 0,
        crossDocumentSimilaritiesComputed: 0,
        filtersApplied: {},
        success: false,
      }
    };
  }
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

/**
 * 3. Topic Trends response normalizer (/intelligence/trends or /intelligence/topics/trends)
 * Extracts the trends array into a hybrid array with sanitized trend items.
 */
export const normalizeTrendsResponse = (response) => {
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

/**
 * 4. Entities response normalizer (/intelligence/entities/:documentId or /intelligence/entities)
 * Handles both single-document entity lists and cross-document entity directories.
 */
export const normalizeEntitiesResponse = (response, isSingleDoc = false) => {
  if (!response) {
    return {
      data: isSingleDoc
        ? { documentName: '', entities: [] }
        : { totalEntities: 0, byType: {}, entities: [] }
    };
  }
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

/**
 * 5. Clusters response normalizer (/intelligence/clusters)
 * Returns clusters object with guaranteed array clusters.
 */
export const normalizeClustersResponse = (response) => {
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

/**
 * 6. Similarity response normalizer (/intelligence/similarity/:documentId or /intelligence/similarity)
 * Handles both per-document similarity and full similarity matrix graph nodes/links.
 */
export const normalizeSimilarityResponse = (response, isSingleDoc = false) => {
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

/**
 * 7. Change Detection response normalizer (/intelligence/changes)
 * Guarantees numeric counters (added, removed, modified) and changes array.
 */
export const normalizeChangesResponse = (response) => {
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

/**
 * 8. Analysis response normalizer (/intelligence/analyze)
 * Guarantees numeric analysis stats.
 */
export const normalizeAnalyzeResponse = (response) => {
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

/**
 * Dispatcher: routes URL patterns to their respective normalizers
 */
export const normalizeApiResponse = (url, response, method = 'get') => {
  if (!response) return response;
  const cleanUrl = (url || '').split('?')[0];

  // Documents listing: exact /documents or ending with /documents
  if (cleanUrl === '/documents' || cleanUrl.endsWith('/documents')) {
    return normalizeDocumentsResponse(response);
  }

  // Topic trends
  if (cleanUrl.includes('/intelligence/topics/trends') || cleanUrl.includes('/intelligence/trends')) {
    return normalizeTrendsResponse(response);
  }

  // Change detection
  if (cleanUrl.includes('/intelligence/changes')) {
    return normalizeChangesResponse(response);
  }

  // Entities
  if (cleanUrl.includes('/intelligence/entities')) {
    const isSingleDoc = cleanUrl.replace(/.*\/intelligence\/entities\/?/, '').length > 0;
    return normalizeEntitiesResponse(response, isSingleDoc);
  }

  // Similarity
  if (cleanUrl.includes('/intelligence/similarity')) {
    const isSingleDoc = cleanUrl.replace(/.*\/intelligence\/similarity\/?/, '').length > 0;
    return normalizeSimilarityResponse(response, isSingleDoc);
  }

  // Clusters
  if (cleanUrl.includes('/intelligence/clusters')) {
    return normalizeClustersResponse(response);
  }

  // Overview
  if (cleanUrl === '/intelligence' || cleanUrl.endsWith('/intelligence')) {
    return normalizeOverviewResponse(response);
  }

  // Analyze
  if (cleanUrl.includes('/intelligence/analyze')) {
    return normalizeAnalyzeResponse(response);
  }

  return response;
};

export default {
  toHybridArray,
  normalizeDocumentsResponse,
  normalizeOverviewResponse,
  normalizeTrendsResponse,
  normalizeEntitiesResponse,
  normalizeClustersResponse,
  normalizeSimilarityResponse,
  normalizeChangesResponse,
  normalizeAnalyzeResponse,
  normalizeApiResponse,
};
