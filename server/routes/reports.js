const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.post('/generate', reportController.generateReport);

module.exports = router;
