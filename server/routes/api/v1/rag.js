const express = require('express');
const router = express.Router();
const ragController = require('../../../controllers/ragController');
const { authenticate } = require('../../../middleware/auth');

router.post('/:documentId/index', authenticate, ragController.indexDocument);
router.post('/search', authenticate, ragController.search);

module.exports = router;
