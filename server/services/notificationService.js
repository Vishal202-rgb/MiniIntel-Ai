const Notification = require('../models/Notification');
const User = require('../models/User');

const notify = async (userId, message, type = 'info', category = 'system', relatedId = null) => {
  try {
    const notification = new Notification({
      userId,
      message,
      type,
      category,
      relatedId
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Notification error (non-blocking):', error.message);
  }
};

const notifyAdmins = async (message, type = 'info', category = 'system', relatedId = null) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'reviewer'] } }).select('_id');
    const promises = admins.map(admin =>
      notify(admin._id, message, type, category, relatedId)
    );
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('notifyAdmins error:', error.message);
  }
};

module.exports = { notify, notifyAdmins };
