const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const query = {};
    // Users see only their notifications; admins see all
    if (req.user && req.user.role !== 'admin') {
      query.$or = [
        { userId: req.user._id },
        { userId: { $exists: false } },
        { userId: null }
      ];
    }
    if (req.query.unread === 'true') query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    const unreadCount = await Notification.countDocuments({
      ...query,
      read: false
    });

    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const query = req.user ? { userId: req.user._id, read: false } : { read: false };
    await Notification.updateMany(query, { read: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
