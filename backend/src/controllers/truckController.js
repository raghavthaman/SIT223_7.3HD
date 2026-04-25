const Truck = require('../models/Truck');

exports.getTruckStatus = async (req, res) => {
  try {
    const truck = await Truck.findOne({ driverId: req.params.id });
    if (!truck) return res.status(404).json({ message: 'Truck status offline or unassigned.' });
    res.json(truck);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
