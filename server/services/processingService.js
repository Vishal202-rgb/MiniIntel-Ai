const path = require('path');
const Document = require('../models/Document');
const ProcessingJob = require('../models/ProcessingJob');
const DocumentPage = require('../models/DocumentPage');
const { extractPdfText } = require('./pdfService');
const { performOcr } = require('./ocrService');
const { extractDocxText } = require('./docxService');
const { extractExcelText, extractCsvText } = require('./excelService');
const { extractPptxText } = require('./pptxService');
const { classifyDocument } = require('./llmService');
const intelligenceService = require('./intelligenceService');

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
      steps = ['Reading file', 'Extracting text', 'OCR fallback (if needed)', 'Saving pages', 'Classifying document'];
    } else if (document.fileType === 'image') {
      steps = ['Reading file', 'Performing OCR', 'Saving pages', 'Classifying document'];
    } else if (document.fileType === 'docx') {
      steps = ['Reading file', 'Extracting text', 'Saving pages', 'Classifying document'];
    } else if (document.fileType === 'xlsx') {
      steps = ['Reading file', 'Extracting sheets', 'Saving pages', 'Classifying document'];
    } else if (document.fileType === 'csv') {
      steps = ['Reading file', 'Parsing CSV', 'Saving pages', 'Classifying document'];
    } else if (document.fileType === 'pptx') {
      steps = ['Reading file', 'Extracting slides', 'Saving pages', 'Classifying document'];
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

    // Environment-aware path
    const baseDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..');
    const filePath = path.join(baseDir, 'uploads', document.filename);
    
    let extractedPages = [];

    await updateProgress(0, 20); // Reading file

    if (document.fileType === 'pdf') {
      const result = await extractPdfText(filePath);
      await updateProgress(1, 40); // Extracting text
      if (result.needsOcr) {
        job.steps[2].status = 'processing';
        await job.save();
        const ocrResult = await performOcr(filePath);
        extractedPages = ocrResult.pages;
        await updateProgress(2, 60);
      } else {
        extractedPages = result.pages;
        if (job.steps[2]) job.steps[2].status = 'completed';
        await updateProgress(2, 60);
      }
    } else if (document.fileType === 'image') {
      const ocrResult = await performOcr(filePath);
      extractedPages = ocrResult.pages;
      await updateProgress(1, 60);
    } else if (document.fileType === 'docx') {
      const docxResult = await extractDocxText(filePath);
      extractedPages = docxResult.pages;
      await updateProgress(1, 60);
    } else if (document.fileType === 'xlsx') {
      const excelResult = await extractExcelText(filePath);
      extractedPages = excelResult.pages;
      await updateProgress(1, 60);
    } else if (document.fileType === 'csv') {
      const csvResult = await extractCsvText(filePath);
      extractedPages = csvResult.pages;
      await updateProgress(1, 60);
    } else if (document.fileType === 'pptx') {
      const pptxResult = await extractPptxText(filePath);
      extractedPages = pptxResult.pages;
      await updateProgress(1, 60);
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
    const savePageStepIndex = steps.length - 2;
    await updateProgress(savePageStepIndex, 80);

    // Classifying document
    const classifyStepIndex = steps.length - 1;
    if (job.steps[classifyStepIndex]) {
      job.steps[classifyStepIndex].status = 'processing';
      await job.save();
    }
    
    const category = await classifyDocument(concatenatedText);
    await updateProgress(classifyStepIndex, 95);

    document.status = 'completed';
    document.category = category;
    document.totalPages = pageRecords.length;
    document.extractedText = concatenatedText.trim();
    document.processedAt = new Date();
    await document.save();

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    await job.save();

    // Fire-and-forget: run NER and topic discovery in background
    // These are non-critical enrichments that should not block document completion
    Promise.allSettled([
      intelligenceService.extractEntities(documentId).catch(e => console.warn('Background NER failed:', e.message)),
      intelligenceService.discoverTopics(documentId).catch(e => console.warn('Background topic discovery failed:', e.message))
    ]).then(() => {
      console.log(`Background intelligence enrichment completed for document ${documentId}`);
    });

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
