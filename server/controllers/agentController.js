const agentOrchestrator = require('../services/agentOrchestrator');

exports.orchestrateTask = async (req, res, next) => {
  try {
    const { task, context } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, message: 'task is required' });
    }

    const result = await agentOrchestrator.orchestrateTask(task, context || {});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
