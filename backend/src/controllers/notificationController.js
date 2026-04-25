const Notification = require('../models/Notification');

exports.getNotificationsByDriverId = async (req, res) => {
  try {
    const notifications = await Notification.find({ driverId: req.params.driverId }).sort({ timestamp: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { driverId, message } = req.body;
    const notification = await Notification.create({
      driverId,
      message,
      type: 'message'
    });
    console.log(`[MONITORING] Admin sent alert message to driver: ${message}`);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.callDriver = async (req, res) => {
  try {
    const { driverId, message } = req.body;
    const notification = await Notification.create({
      driverId,
      message,
      type: 'call'
    });
    console.log(`[MONITORING] Admin dispatched Simulated Call to driver: ${message}`);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const updatePayload = { read: true };
    if (req.body.status) updatePayload.status = req.body.status;

    const notification = await Notification.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
