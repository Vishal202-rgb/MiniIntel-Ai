require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/db');
const documentRoutes = require('./routes/documents');
const extractionRoutes = require('./routes/extraction');
const validationRoutes = require('./routes/validation');
const ragRoutes = require('./routes/rag');
const aiAssistantRoutes = require('./routes/aiAssistant');
const analyticsRoutes = require('./routes/analytics');
const topicRoutes = require('./routes/topics');
const reportRoutes = require('./routes/reports');
const agentRoutes = require('./routes/agents');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Connect to Database
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/extraction', extractionRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown for nodemon restarts
process.once('SIGUSR2', function () {
  server.close(function () {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', function () {
  server.close(function () {
    process.exit(0);
  });
});

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit(0);
  });
});

module.exports = app;
