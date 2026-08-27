const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  }
  
  if (err.message === 'Invalid file type. Only PDF, DOCX, XLSX, CSV, JPEG, and PNG are allowed.') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || 'Internal Server Error' });
};

module.exports = errorHandler;
