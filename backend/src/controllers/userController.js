const User = require('../models/User');

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).select('-password');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
