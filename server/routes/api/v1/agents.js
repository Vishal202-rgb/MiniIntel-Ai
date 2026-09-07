const express = require('express');
const router = express.Router();
const agentController = require('../../../controllers/agentController');
const { authenticate } = require('../../../middleware/auth');

router.post('/orchestrate', authenticate, agentController.orchestrateTask);

module.exports = router;
