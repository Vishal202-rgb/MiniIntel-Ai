const express = require('express');
const router = express.Router();
const helpController = require('../../../controllers/helpController');
const { authenticate } = require('../../../middleware/auth');

router.get('/', authenticate, helpController.getHelpOverview);
router.get('/faqs', authenticate, helpController.getFaqs);
router.get('/search', authenticate, helpController.searchHelp);
router.get('/faqs/:id', authenticate, helpController.getFaqById);

module.exports = router;
