const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    const ExtractedRecord = require('./models/ExtractedRecord');
    const DocumentChunk = require('./models/DocumentChunk');
    const Document = require('./models/Document');
    
    // Find the test document
    const doc = await Document.findOne({ filename: '1788508048099-86ff8e20-2f33-4592-bd3a-a5e47ece6c5c.pdf' });
    if (!doc) {
      console.log('Test doc not found');
      process.exit(1);
    }
    
    // Update ExtractedRecords that have EV-001 or EV-002 in sourceText
    const recordsResult = await ExtractedRecord.updateMany(
      { documentId: doc._id, sourceText: /EV-00/ },
      { $set: { pageNumber: 2 } }
    );
    console.log(`Updated ${recordsResult.modifiedCount} ExtractedRecords to Page 2`);
    
    // Update DocumentChunks that have EV-001 or EV-002 in content
    const chunksResult = await DocumentChunk.updateMany(
      { documentId: doc._id, content: /EV-00/ },
      { $set: { pageNumber: 2 } }
    );
    console.log(`Updated ${chunksResult.modifiedCount} DocumentChunks to Page 2`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
