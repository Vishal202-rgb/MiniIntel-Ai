const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Document = require('../server/models/Document');
const ExtractedRecord = require('../server/models/ExtractedRecord');
const DocumentChunk = require('../server/models/DocumentChunk');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await Document.find({}).select('_id originalName filename status isArchived');
    console.log('DOCS (' + docs.length + '):');
    docs.forEach(d => console.log(` - ${d._id}: ${d.originalName || d.filename} (${d.status})`));

    const totalChunks = await DocumentChunk.countDocuments();
    console.log('TOTAL CHUNKS:', totalChunks);

    const chunkCounts = await DocumentChunk.aggregate([
      { $group: { _id: '$documentId', count: { $sum: 1 } } }
    ]);
    console.log('CHUNKS BY DOC:');
    chunkCounts.forEach(c => console.log(` - ${c._id}: ${c.count} chunks`));

    const records = await ExtractedRecord.find({});
    console.log('EXTRACTED RECORDS COUNT:', records.length);
    records.slice(0, 8).forEach(r => {
      console.log(` - [${r.status}] ${r.parameter}: ${r.value} ${r.unit} (Period: ${r.period}, Page: ${r.pageNumber})`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
