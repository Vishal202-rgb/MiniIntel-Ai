require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const ExtractedRecord = require('./server/models/ExtractedRecord');
const Document = require('./server/models/Document');
const Report = require('./server/models/Report');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const records = await ExtractedRecord.find({});
  console.log('Total records:', records.length);
  const parameters = await ExtractedRecord.distinct('parameter');
  console.log('Parameters:', parameters);

  // Group by parameter
  for (const p of parameters) {
    const pRecords = records.filter(r => r.parameter === p);
    console.log(p, pRecords.map(r => ({ value: r.value, unit: r.unit, period: r.period })).slice(0, 3));
  }
  
  const docs = await Document.countDocuments({});
  console.log('Total docs:', docs);

  mongoose.disconnect();
});
