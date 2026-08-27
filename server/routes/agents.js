const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/orchestrate', agentController.orchestrateTask);

module.exports = router;
