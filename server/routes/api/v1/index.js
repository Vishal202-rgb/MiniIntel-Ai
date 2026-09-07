const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');
const authRoutes = require('./auth');
const documentRoutes = require('./documents');
const reportRoutes = require('./reports');
const validationRoutes = require('./validation');
const ragRoutes = require('./rag');
const knowledgeBaseRoutes = require('./knowledgeBase');
const aiAssistantRoutes = require('./aiAssistant');
const analyticsRoutes = require('./analytics');
const topicRoutes = require('./topics');
const extractionRoutes = require('./extraction');
const agentRoutes = require('./agents');
const auditRoutes = require('./audit');
const adminRoutes = require('./admin');
const notificationRoutes = require('./notifications');
const intelligenceRoutes = require('./intelligence');
const integrationRoutes = require('./integration');
const reviewRoutes = require('./reviews');
const dashboardRoutes = require('./dashboard');
const commandCentreRoutes = require('./commandCentre');
const settingsRoutes = require('./settings');
const helpRoutes = require('./help');
const notFoundHandler = require('../../../middleware/notFoundHandler');

// Mount all v1 sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/command-centre', commandCentreRoutes);
router.use('/command-center', commandCentreRoutes);
router.use('/settings', settingsRoutes);
router.use('/help', helpRoutes);
router.use('/documents', documentRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/validation', validationRoutes);
router.use('/knowledge-base', knowledgeBaseRoutes);
router.use('/rag', ragRoutes);
router.use('/ai-assistant', aiAssistantRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/topics', topicRoutes);
router.use('/extraction', extractionRoutes);
router.use('/agents', agentRoutes);
router.use('/audit', auditRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/integration', integrationRoutes);

// Catch-all 404 for unhandled /api/v1 routes
router.use(notFoundHandler);

module.exports = router;
