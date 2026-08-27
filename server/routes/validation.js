const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validationController');

router.post('/:documentId/validate', validationController.validate);
router.get('/summary', validationController.getSummary);
router.get('/:documentId', validationController.getResults);
router.put('/:id/resolve', validationController.resolveIssue);

module.exports = router;
