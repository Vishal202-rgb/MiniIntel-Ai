const fs = require('fs');
const pdfParse = require('pdf-parse');

const extractPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  
  const text = data.text;
  if (text.length < 50) {
    return { pages: [], needsOcr: true };
  }
  
  const rawPages = text.split('\f');
  const pages = [];
  
  rawPages.forEach((pageContent, index) => {
    const content = pageContent.trim();
    if (content) {
      pages.push({
        pageNumber: index + 1,
        content: content,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length
      });
    }
  });

  return { pages, needsOcr: false };
};

module.exports = { extractPdfText };
