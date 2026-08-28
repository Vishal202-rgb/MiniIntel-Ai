const mongoose = require('mongoose');
require('dotenv').config();
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const ExtractedRecord = require('./models/ExtractedRecord');
    const records = await ExtractedRecord.find();
    console.log("Total records in DB:", records.length);
    if (records.length > 0) {
      console.log("First record documentId:", records[0].documentId, "Type:", typeof records[0].documentId);
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();
