const agentOrchestrator = require('../services/agentOrchestrator');

const activeTasks = new Set();

exports.orchestrateTask = async (req, res, next) => {
  try {
    const { task, context } = req.body;
    
    if (!task) {
      return res.status(400).json({ success: false, message: 'task is required' });
    }

    if (activeTasks.has(task)) {
      return res.status(409).json({ success: false, message: 'This exact task is currently being processed. Please wait.' });
    }

    activeTasks.add(task);

    const orchestrationPromise = agentOrchestrator.orchestrateTask(task, context || {})
      .then(result => {
        activeTasks.delete(task);
        return result;
      })
      .catch(error => {
        activeTasks.delete(task);
        throw error;
      });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ isTimeout: true, message: 'Task Accepted / Processing' }), 15000);
    });

    try {
      const result = await Promise.race([orchestrationPromise, timeoutPromise]);
      
      if (result && result.isTimeout) {
        // Leave the orchestration running in the background
        return res.status(202).json({ success: true, message: result.message, data: result });
      }
      
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};
