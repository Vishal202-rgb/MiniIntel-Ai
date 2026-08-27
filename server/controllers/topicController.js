const Topic = require('../models/Topic');
const topicService = require('../services/topicService');

exports.getTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find().populate('documents', 'filename title');
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
};

exports.extractTopics = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ success: false, message: 'documentId is required' });
    }
    const topics = await topicService.extractTopics(documentId);
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
};
