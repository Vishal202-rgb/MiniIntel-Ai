const path = require('path');
const Document = require('../models/Document');
const ProcessingJob = require('../models/ProcessingJob');
const DocumentPage = require('../models/DocumentPage');
const { extractPdfText } = require('./pdfService');
const { performOcr } = require('./ocrService');
const { extractDocxText } = require('./docxService');
const { extractExcelText, extractCsvText } = require('./excelService');

const processDocument = async (documentId) => {
  try {
    const document = await Document.findById(documentId);
    if (!document) throw new Error('Document not found');

    let job = await ProcessingJob.findOne({ documentId });
    if (!job) {
      job = new ProcessingJob({ documentId });
    }

    document.status = 'processing';
    await document.save();

    job.status = 'processing';
    job.startedAt = new Date();
    
    let steps = [];
    if (document.fileType === 'pdf') {
      steps = ['Reading file', 'Extracting text', 'OCR fallback (if needed)', 'Saving pages'];
    } else if (document.fileType === 'image') {
      steps = ['Reading file', 'Performing OCR', 'Saving pages'];
    } else if (document.fileType === 'docx') {
      steps = ['Reading file', 'Extracting text', 'Saving pages'];
    } else if (document.fileType === 'xlsx') {
      steps = ['Reading file', 'Extracting sheets', 'Saving pages'];
    } else if (document.fileType === 'csv') {
      steps = ['Reading file', 'Parsing CSV', 'Saving pages'];
    }
    
    job.steps = steps.map(name => ({ name, status: 'pending' }));
    await job.save();

    const updateProgress = async (stepIndex, progress) => {
      if (job.steps[stepIndex]) {
        job.steps[stepIndex].status = 'completed';
      }
      job.currentStep = steps[stepIndex] || 'Processing';
      job.progress = progress;
      await job.save();
    };

    const filePath = path.join(__dirname, '..', 'uploads', document.filename);
    let extractedPages = [];

    await updateProgress(0, 20); // Reading file

    if (document.fileType === 'pdf') {
      const result = await extractPdfText(filePath);
      await updateProgress(1, 50); // Extracting text
      if (result.needsOcr) {
        job.steps[2].status = 'processing';
        await job.save();
        const ocrResult = await performOcr(filePath);
        extractedPages = ocrResult.pages;
        await updateProgress(2, 80);
      } else {
        extractedPages = result.pages;
        if (job.steps[2]) job.steps[2].status = 'completed';
        await updateProgress(2, 80);
      }
    } else if (document.fileType === 'image') {
      const ocrResult = await performOcr(filePath);
      extractedPages = ocrResult.pages;
      await updateProgress(1, 80);
    } else if (document.fileType === 'docx') {
      const docxResult = await extractDocxText(filePath);
      extractedPages = docxResult.pages;
      await updateProgress(1, 80);
    } else if (document.fileType === 'xlsx') {
      const excelResult = await extractExcelText(filePath);
      extractedPages = excelResult.pages;
      await updateProgress(1, 80);
    } else if (document.fileType === 'csv') {
      const csvResult = await extractCsvText(filePath);
      extractedPages = csvResult.pages;
      await updateProgress(1, 80);
    }

    // Saving pages
    await DocumentPage.deleteMany({ documentId: document._id });
    
    let concatenatedText = '';
    const pageRecords = extractedPages.map(p => {
      concatenatedText += p.content + '\n\n';
      return {
        documentId: document._id,
        pageNumber: p.pageNumber,
        content: p.content,
        wordCount: p.wordCount
      };
    });

    await DocumentPage.insertMany(pageRecords);
    await updateProgress(steps.length - 1, 95);

    document.status = 'completed';
    document.totalPages = pageRecords.length;
    document.extractedText = concatenatedText.trim();
    document.processedAt = new Date();
    await document.save();

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    await job.save();

  } catch (error) {
    console.error('Processing error:', error);
    
    const document = await Document.findById(documentId);
    if (document) {
      document.status = 'failed';
      document.error = error.message;
      await document.save();
    }

    const job = await ProcessingJob.findOne({ documentId });
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      await job.save();
    }
  }
};

module.exports = { processDocument };
