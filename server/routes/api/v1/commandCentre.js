const express = require('express');
const router = express.Router();
const commandCentreController = require('../../../controllers/commandCentreController');
const { authenticate } = require('../../../middleware/auth');

router.get('/overview', authenticate, commandCentreController.getOverview);
router.get('/pipeline', authenticate, commandCentreController.getPipeline);
router.get('/status', authenticate, commandCentreController.getStatus);
router.get('/attention-items', authenticate, commandCentreController.getAttentionItems);
router.get('/activity', authenticate, commandCentreController.getActivity);

module.exports = router;
