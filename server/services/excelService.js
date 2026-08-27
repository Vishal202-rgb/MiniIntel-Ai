const xlsx = require('xlsx');

const extractExcelText = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const pages = [];
  
  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];
    const csvContent = xlsx.utils.sheet_to_csv(sheet);
    
    if (csvContent.trim()) {
      pages.push({
        pageNumber: index + 1,
        content: `Sheet: ${sheetName}\n\n${csvContent}`,
        wordCount: csvContent.trim().split(/\s+/).filter(w => w.length > 0).length
      });
    }
  });

  return { pages };
};

const extractCsvText = async (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const csvContent = xlsx.utils.sheet_to_csv(sheet);
  
  return {
    pages: [{
      pageNumber: 1,
      content: csvContent.trim(),
      wordCount: csvContent.trim().split(/\s+/).filter(w => w.length > 0).length
    }]
  };
};

module.exports = { extractExcelText, extractCsvText };
