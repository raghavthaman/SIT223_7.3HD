const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      message
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getChat = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
