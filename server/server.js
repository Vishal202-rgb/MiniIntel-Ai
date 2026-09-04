const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
});

// Fallback: also support .env in project root
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

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

// Environment-aware uploads directory
const baseDir = process.env.VERCEL ? '/tmp' : __dirname;
const uploadsDir = path.join(baseDir, 'uploads');

// Create uploads directory only when writable
if (!process.env.VERCEL) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

// Environment check
console.log('Environment loaded:');
console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME || 'NOT SET');
console.log(
  'ADMIN_PASSWORD:',
  process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET'
);
console.log(
  'JWT_SECRET:',
  process.env.JWT_SECRET ? 'SET' : 'NOT SET'
);

// Connect to Database
connectDB();

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(uploadsDir));

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

// Start server
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
// Trigger nodemon restart

// Trigger nodemon restart 2

// Trigger nodemon restart 3
