const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const performOcr = async (filePath) => {
  let worker = null;
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    worker = await createWorker('eng');
    
    // If it's a PDF, we need to convert pages to images first
    if (ext === '.pdf') {
      const pdf2img = require('pdf-img-convert');
      
      // Convert PDF to an array of Uint8Arrays representing PNG images
      const images = await pdf2img.convert(filePath, { 
        width: 2000
      });
      
      const pages = [];
      for (let i = 0; i < images.length; i++) {
        // Write buffer to temp file so tesseract can read it (or pass buffer directly)
        const imageBuffer = Buffer.from(images[i]);
        const { data: { text } } = await worker.recognize(imageBuffer);
        
        pages.push({
          pageNumber: i + 1,
          content: text.trim(),
          wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length
        });
      }
      return { pages };
    } 
    
    // For normal images
    const { data: { text } } = await worker.recognize(filePath);
    return {
      pages: [{
        pageNumber: 1,
        content: text.trim(),
        wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length
      }]
    };
  } catch (error) {
    throw new Error(`OCR Error: ${error.message}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

module.exports = { performOcr };
