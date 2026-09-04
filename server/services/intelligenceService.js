const Document = require('../models/Document');
const Topic = require('../models/Topic');
const ExtractedRecord = require('../models/ExtractedRecord');
const DocumentChunk = require('../models/DocumentChunk');
const llmService = require('./llmService');
const ragService = require('./ragService');

// =============================================
// 1. NAMED ENTITY RECOGNITION
// =============================================
exports.extractEntities = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document || !document.extractedText) return [];

  const text = document.extractedText.substring(0, 5000);

  const systemPrompt = `You are a Named Entity Recognition (NER) engine for mining industry documents.
Extract all named entities from the provided text.

Return ONLY valid JSON:
{
  "entities": [
    { "name": "Jayant Mine", "type": "Mine", "mentions": 3 },
    { "name": "NCL", "type": "Subsidiary", "mentions": 5 }
  ]
}

Entity types MUST be one of: Mine, Subsidiary, Location, Equipment, Project, Person, Organization, Other.
Count how many times each entity appears approximately. Do not invent entities.`;

  try {
    const res = await llmService.callLLM(systemPrompt, `Extract entities:\n${text}`, { format: 'json', reqContext: { isComplex: false } });
    const entities = Array.isArray(res.entities) ? res.entities : [];
    
    // Validate and clean
    const validTypes = ['Mine', 'Subsidiary', 'Location', 'Equipment', 'Project', 'Person', 'Organization', 'Other'];
    const cleaned = entities
      .filter(e => e.name && e.type)
      .map(e => ({
        name: e.name,
        type: validTypes.includes(e.type) ? e.type : 'Other',
        mentions: Math.max(1, parseInt(e.mentions) || 1)
      }));

    document.entities = cleaned;
    await document.save();
    return cleaned;
  } catch (err) {
    console.warn('Entity extraction failed:', err.message);
    return [];
  }
};

// =============================================
// 2. TOPIC DISCOVERY & CLUSTERING
// =============================================
exports.discoverTopics = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document || !document.extractedText) return [];

  const text = document.extractedText.substring(0, 5000);

  // Extract period info from records for trend tracking
  const records = await ExtractedRecord.find({ documentId }).lean();
  const periods = [...new Set(records.map(r => r.period).filter(Boolean))];

  const systemPrompt = `You are a Topic Discovery engine for mining documents.
Identify the main topics/themes in this text.

Return ONLY valid JSON:
{
  "topics": [
    { "name": "Coal Production", "keywords": ["production", "output", "coal", "MT"], "weight": 0.9 },
    { "name": "Safety Compliance", "keywords": ["safety", "incident", "compliance"], "weight": 0.7 }
  ]
}

Rules:
- Return 3-8 topics maximum.
- Each topic needs a clear, concise name.
- weight is 0-1 indicating how dominant the topic is.
- keywords should be 3-6 relevant terms.`;

  try {
    const res = await llmService.callLLM(systemPrompt, `Discover topics:\n${text}`, { format: 'json', reqContext: { isComplex: false } });
    const topicsData = Array.isArray(res.topics) ? res.topics : [];

    const createdTopicIds = [];

    for (const td of topicsData) {
      if (!td.name) continue;

      let topic = await Topic.findOne({ name: { $regex: new RegExp(`^${td.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });

      if (!topic) {
        topic = new Topic({
          name: td.name,
          keywords: td.keywords || [],
          documents: [documentId],
          weight: td.weight || 1.0
        });
      } else {
        if (!topic.documents.includes(documentId)) {
          topic.documents.push(documentId);
        }
        topic.keywords = [...new Set([...topic.keywords, ...(td.keywords || [])])];
      }

      // Update trend data for each period found in the document
      for (const period of periods) {
        const existingTrend = topic.trendData.find(t => t.period === period);
        if (existingTrend) {
          existingTrend.count += 1;
          existingTrend.avgWeight = (existingTrend.avgWeight + (td.weight || 1.0)) / 2;
        } else {
          topic.trendData.push({ period, count: 1, avgWeight: td.weight || 1.0 });
        }
      }

      await topic.save();
      createdTopicIds.push(topic._id);
    }

    // Compute related topics (co-occurrence: topics that share documents)
    for (const topicId of createdTopicIds) {
      const thisTopic = await Topic.findById(topicId);
      if (!thisTopic) continue;

      const coOccurring = await Topic.find({
        _id: { $ne: topicId },
        documents: { $in: thisTopic.documents }
      }).lean();

      thisTopic.relatedTopics = coOccurring.map(co => ({
        topicId: co._id,
        strength: co.documents.filter(d => thisTopic.documents.map(String).includes(String(d))).length / Math.max(thisTopic.documents.length, 1)
      })).slice(0, 5);

      await thisTopic.save();
    }

    // Save topic references on the document
    document.topicIds = createdTopicIds;
    await document.save();

    return createdTopicIds;
  } catch (err) {
    console.warn('Topic discovery failed:', err.message);
    return [];
  }
};

// =============================================
// 3. DOCUMENT SIMILARITY (Deterministic)
// =============================================
exports.computeDocumentSimilarity = async (documentId) => {
  // Get all chunks for target document
  const targetChunks = await DocumentChunk.find({
    documentId,
    embedding: { $exists: true, $ne: [] }
  }).lean();

  if (targetChunks.length === 0) return [];

  // Compute average embedding for target document
  const embLen = targetChunks[0].embedding.length;
  const avgEmbedding = new Array(embLen).fill(0);

  for (const chunk of targetChunks) {
    for (let i = 0; i < embLen; i++) {
      avgEmbedding[i] += chunk.embedding[i];
    }
  }
  for (let i = 0; i < embLen; i++) {
    avgEmbedding[i] /= targetChunks.length;
  }

  // Get all other documents' chunks
  const otherChunks = await DocumentChunk.find({
    documentId: { $ne: documentId },
    embedding: { $exists: true, $ne: [] }
  }).populate('documentId', 'originalName filename').lean();

  // Group by document and compute avg embedding
  const docEmbeddings = {};
  for (const chunk of otherChunks) {
    const did = String(chunk.documentId._id || chunk.documentId);
    if (!docEmbeddings[did]) {
      docEmbeddings[did] = {
        doc: chunk.documentId,
        embeddings: [],
      };
    }
    docEmbeddings[did].embeddings.push(chunk.embedding);
  }

  // Cosine similarity helper
  const cosine = (a, b) => {
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      nA += a[i] * a[i];
      nB += b[i] * b[i];
    }
    if (nA === 0 || nB === 0) return 0;
    return dot / (Math.sqrt(nA) * Math.sqrt(nB));
  };

  const similarities = [];
  for (const [did, data] of Object.entries(docEmbeddings)) {
    const otherAvg = new Array(embLen).fill(0);
    for (const emb of data.embeddings) {
      for (let i = 0; i < embLen; i++) otherAvg[i] += emb[i];
    }
    for (let i = 0; i < embLen; i++) otherAvg[i] /= data.embeddings.length;

    const score = cosine(avgEmbedding, otherAvg);
    similarities.push({
      documentId: did,
      doc: data.doc,
      score: Math.round(score * 1000) / 1000
    });
  }

  similarities.sort((a, b) => b.score - a.score);
  const top5 = similarities.slice(0, 5);

  // Save to document
  const document = await Document.findById(documentId);
  if (document) {
    document.similarDocuments = top5.map(s => ({
      documentId: s.documentId,
      score: s.score
    }));
    await document.save();
  }

  return top5;
};

// =============================================
// 4. CHANGE DETECTION (Fully Deterministic)
// =============================================
exports.detectChanges = async (docIdA, docIdB) => {
  const [recordsA, recordsB] = await Promise.all([
    ExtractedRecord.find({ documentId: docIdA }).lean(),
    ExtractedRecord.find({ documentId: docIdB }).lean()
  ]);

  const [docA, docB] = await Promise.all([
    Document.findById(docIdA, 'originalName').lean(),
    Document.findById(docIdB, 'originalName').lean()
  ]);

  const keyFn = (r) => `${(r.parameter || '').toLowerCase()}|${(r.mineName || '').toLowerCase()}|${(r.subsidiary || '').toLowerCase()}`;

  const mapA = {};
  for (const r of recordsA) {
    const k = keyFn(r);
    if (!mapA[k]) mapA[k] = [];
    mapA[k].push(r);
  }

  const mapB = {};
  for (const r of recordsB) {
    const k = keyFn(r);
    if (!mapB[k]) mapB[k] = [];
    mapB[k].push(r);
  }

  const allKeys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
  const changes = [];

  for (const key of allKeys) {
    const inA = mapA[key];
    const inB = mapB[key];

    if (inA && !inB) {
      changes.push({
        type: 'removed',
        parameter: inA[0].parameter,
        mineName: inA[0].mineName,
        subsidiary: inA[0].subsidiary,
        oldValue: inA.map(r => `${r.value} ${r.unit || ''} (${r.period || ''})`).join('; '),
        newValue: null
      });
    } else if (!inA && inB) {
      changes.push({
        type: 'added',
        parameter: inB[0].parameter,
        mineName: inB[0].mineName,
        subsidiary: inB[0].subsidiary,
        oldValue: null,
        newValue: inB.map(r => `${r.value} ${r.unit || ''} (${r.period || ''})`).join('; ')
      });
    } else {
      // Both exist — check if values differ
      const valsA = inA.map(r => r.value).sort().join(',');
      const valsB = inB.map(r => r.value).sort().join(',');
      if (valsA !== valsB) {
        changes.push({
          type: 'changed',
          parameter: inA[0].parameter,
          mineName: inA[0].mineName || inB[0].mineName,
          subsidiary: inA[0].subsidiary || inB[0].subsidiary,
          oldValue: inA.map(r => `${r.value} ${r.unit || ''} (${r.period || ''})`).join('; '),
          newValue: inB.map(r => `${r.value} ${r.unit || ''} (${r.period || ''})`).join('; ')
        });
      }
    }
  }

  return {
    documentA: { id: docIdA, name: docA?.originalName || 'Document A' },
    documentB: { id: docIdB, name: docB?.originalName || 'Document B' },
    totalChanges: changes.length,
    added: changes.filter(c => c.type === 'added').length,
    removed: changes.filter(c => c.type === 'removed').length,
    modified: changes.filter(c => c.type === 'changed').length,
    changes
  };
};

// =============================================
// 5. CROSS-DOCUMENT EVIDENCE LINKING
// =============================================
exports.linkEvidence = async (documentId) => {
  const records = await ExtractedRecord.find({ documentId });
  if (records.length === 0) return [];

  const linked = [];

  // Process in batches of 5 to avoid overwhelming RAG
  for (let i = 0; i < Math.min(records.length, 20); i++) {
    const record = records[i];
    const query = `${record.parameter} ${record.value} ${record.unit || ''} ${record.mineName || ''} ${record.period || ''}`.trim();

    try {
      const chunks = await ragService.searchSimilar(query, 3, { isComplex: false });

      // Filter out chunks from the same document
      const crossDocChunks = chunks.filter(c => {
        const chunkDocId = c.documentId?._id || c.documentId;
        return String(chunkDocId) !== String(documentId);
      });

      if (crossDocChunks.length > 0) {
        record.linkedEvidence = crossDocChunks.map(c => ({
          documentId: c.documentId?._id || c.documentId,
          pageNumber: c.pageNumber,
          snippet: (c.content || '').substring(0, 200),
          similarity: c.similarityScore
        }));
        await record.save();
        linked.push({ recordId: record._id, parameter: record.parameter, linkedCount: crossDocChunks.length });
      }
    } catch (err) {
      console.warn(`Evidence linking failed for record ${record._id}:`, err.message);
    }
  }

  return linked;
};

// =============================================
// 6. TOPIC TRENDS (Deterministic aggregation)
// =============================================
exports.getTopicTrends = async () => {
  const topics = await Topic.find({ 'trendData.0': { $exists: true } })
    .select('name trendData weight')
    .lean();

  return topics.map(t => ({
    name: t.name,
    weight: t.weight,
    trends: t.trendData.sort((a, b) => a.period.localeCompare(b.period))
  }));
};
