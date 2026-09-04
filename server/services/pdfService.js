const fs = require('fs');
const pdfParse = require('pdf-parse-new');

const extractPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  
  function render_page(pageData) {
      let render_options = {
          normalizeWhitespace: false,
          disableCombineTextItems: false
      };
      return pageData.getTextContent(render_options)
      .then(function(textContent) {
          let lastY, text = '';
          for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY){
                  text += item.str;
              } else {
                  text += '\n' + item.str;
              }
              lastY = item.transform[5];
          }
          return text + '<<PAGE_BREAK>>';
      });
  }

  try {
    const data = await pdfParse(dataBuffer, { pagerender: render_page });
    const text = data.text;
    
    // Scanned PDFs or images saved as PDF usually return very little text
    if (!text || text.trim().length < 10) {
      return { pages: [], needsOcr: true };
    }
    
    // pdfParse concatenates results with \n by default, and we added <<PAGE_BREAK>>
    const rawPages = text.split('<<PAGE_BREAK>>');
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
