const DocumentPage = require('../models/DocumentPage');

const chunkDocument = async (documentId) => {
  const pages = await DocumentPage.find({ documentId }).sort({ pageNumber: 1 });
  const chunks = [];
  let chunkIndex = 0;
  
  for (const page of pages) {
    if (!page.content) continue;
    
    const words = page.content.split(/\s+/);
    const chunkSize = 500;
    const overlap = 50;
    
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
      const chunkWords = words.slice(i, i + chunkSize);
      const content = chunkWords.join(' ');
      
      chunks.push({
        documentId,
        pageNumber: page.pageNumber,
        chunkIndex,
        content,
        metadata: {
          mineName: 'Unknown'
        }
      });
      chunkIndex++;
      
      if (i + chunkSize >= words.length) {
        break;
      }
    }
  }
  
  return chunks;
};

module.exports = {
  chunkDocument
};
