const Message = require('../models/Message');
const Notification = require('../models/Notification');

exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch Messages involving user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).lean();

    // Fetch Calls (Notifications with type 'call') involving driver
    // Assuming driverId field in Notification
    const calls = await Notification.find({
      driverId: userId,
      type: 'call'
    }).lean();

    // Standardize object for timeline map
    const combinedHistory = [
      ...messages.map(m => ({ ...m, historyType: 'message', time: m.timestamp })),
      ...calls.map(c => ({ ...c, historyType: 'call', time: c.timestamp }))
    ];

    // Sort chronologically (newest first)
    combinedHistory.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(combinedHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
