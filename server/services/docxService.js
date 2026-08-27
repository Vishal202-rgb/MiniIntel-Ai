const fs = require('fs');
const mammoth = require('mammoth');

const extractDocxText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  
  const text = result.value;
  // Split on double newlines to create logical pages (every ~3000 chars roughly if needed, here just splitting by double newlines for chunking)
  const logicalChunks = text.split('\n\n').filter(chunk => chunk.trim().length > 0);
  
  // Combine chunks into pages of ~3000 chars
  const pages = [];
  let currentPageText = '';
  let pageNumber = 1;

  for (const chunk of logicalChunks) {
    if (currentPageText.length + chunk.length > 3000) {
      pages.push({
        pageNumber,
        content: currentPageText.trim(),
        wordCount: currentPageText.trim().split(/\s+/).filter(w => w.length > 0).length
      });
      pageNumber++;
      currentPageText = chunk + '\n\n';
    } else {
      currentPageText += chunk + '\n\n';
    }
  }

  if (currentPageText.trim().length > 0) {
    pages.push({
      pageNumber,
      content: currentPageText.trim(),
      wordCount: currentPageText.trim().split(/\s+/).filter(w => w.length > 0).length
    });
  }

  return { pages };
};

module.exports = { extractDocxText };
