const { createWorker } = require('tesseract.js');

const performOcr = async (filePath) => {
  let worker = null;
  try {
    worker = await createWorker('eng');
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
