const fs = require('fs');
const pdfParse = require('pdf-parse-new');

const extractPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    
    // Scanned PDFs or images saved as PDF usually return very little text
    if (!text || text.trim().length < 10) {
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
  } catch (error) {
    console.error("PDF Parsing error:", error.message);
    // If it completely fails to parse (e.g. bad xref), we can fallback to OCR 
    // assuming it might be a malformed or scanned PDF
    return { pages: [], needsOcr: true };
  }
};

module.exports = { extractPdfText };
