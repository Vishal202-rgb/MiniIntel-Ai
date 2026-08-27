const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');

router.post('/:documentId/index', ragController.indexDocument);
router.post('/search', ragController.search);

module.exports = router;
