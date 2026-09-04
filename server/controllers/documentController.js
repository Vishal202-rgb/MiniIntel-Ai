const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Document = require('../models/Document');
const DocumentPage = require('../models/DocumentPage');
const ProcessingJob = require('../models/ProcessingJob');
const { processDocument } = require('../services/processingService');

const getFileType = (mimetype) => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('wordprocessingml.document')) return 'docx';
  if (mimetype.includes('spreadsheetml.sheet') || mimetype === 'application/vnd.ms-excel') return 'xlsx';
  if (mimetype.includes('presentationml.presentation') || mimetype === 'application/vnd.ms-powerpoint') return 'pptx';
  if (mimetype === 'text/csv') return 'csv';
  if (mimetype.startsWith('image/')) return 'image';
  return 'pdf'; // fallback
};

const getFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileHash = await getFileHash(req.file.path);
    const existingDoc = await Document.findOne({ hash: fileHash });
    
    if (existingDoc) {
      fs.unlinkSync(req.file.path);
      return res.status(409).json({ error: 'Duplicate document detected (checksum matched).' });
    }

    const fileType = getFileType(req.file.mimetype);

    const document = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileType: fileType,
      hash: fileHash,
      userId: req.user._id
    });

    await document.save();

    const job = new ProcessingJob({
      documentId: document._id,
      status: 'queued'
    });
    await job.save();

    // Fire and forget
    processDocument(document._id);

    res.status(201).json(document);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { search, type, status } = req.query;
    const query = {};

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }
    if (type) {
      query.fileType = type;
    }
    if (status) {
      query.status = status;
    }
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const documents = await Document.find(query).sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const pages = await DocumentPage.find({ documentId: document._id }).sort({ pageNumber: 1 });
    res.json({ document, pages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDocumentStatus = async (req, res) => {
  try {
    const job = await ProcessingJob.findOne({ documentId: req.params.id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Document.findByIdAndDelete(req.params.id);
    await DocumentPage.deleteMany({ documentId: req.params.id });
    await ProcessingJob.deleteMany({ documentId: req.params.id });

    const baseDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..');
    const filePath = path.join(baseDir, 'uploads', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const retryDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (req.user.role !== 'admin' && document.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (document.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed documents can be retried' });
    }

    document.status = 'pending';
    document.error = '';
    await document.save();

    await ProcessingJob.deleteMany({ documentId: document._id });
    
    const job = new ProcessingJob({
      documentId: document._id,
      status: 'queued'
    });
    await job.save();

    // Fire and forget
    processDocument(document._id);

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentStatus,
  deleteDocument,
  retryDocument
};
