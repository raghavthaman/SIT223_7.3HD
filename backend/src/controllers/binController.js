const Bin = require('../models/Bin');
const { calculateStatus } = require('../utils/statusCalculator');

// @desc    Get all bins
// @route   GET /api/bins
exports.getBins = async (req, res) => {
  try {
    const bins = await Bin.find();
    res.status(200).json(bins);
  } catch (error) {
    console.error('Error fetching bins:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single bin
// @route   GET /api/bins/:id
exports.getBinById = async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    res.status(200).json(bin);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new bin
// @route   POST /api/bins
exports.createBin = async (req, res) => {
  try {
    const { location, fillLevel } = req.body;
    
    if (fillLevel === undefined || !location) {
      return res.status(400).json({ message: 'Please provide location and fillLevel' });
    }

    const status = calculateStatus(fillLevel);
    
    const bin = await Bin.create({
      location,
      fillLevel,
      status
    });

    res.status(201).json(bin);
  } catch (error) {
    console.error('Error creating bin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update bin fill level
// @route   PUT /api/bins/:id
exports.updateBin = async (req, res) => {
  try {
    const { fillLevel } = req.body;
    
    if (fillLevel === undefined) {
      return res.status(400).json({ message: 'Please provide fillLevel' });
    }

    const bin = await Bin.findById(req.params.id);
    
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    const status = calculateStatus(fillLevel);

    bin.fillLevel = fillLevel;
    bin.status = status;
    
    await bin.save();
    
    res.status(200).json(bin);
  } catch (error) {
    console.error('Error updating bin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Assign driver to bin
// @route   PUT /api/bins/:id/assign
exports.assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    const bin = await Bin.findByIdAndUpdate(req.params.id, { assignedTo: driverId || null }, { new: true });
    if (!bin) return res.status(404).json({ message: 'Bin not found' });
    console.log(`[MONITORING] Admin assigned driver to Bin ${bin.location}`);
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Driver submit feedback & image
// @route   PUT /api/bins/:id/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { feedback, imageUrl } = req.body;
    const bin = await Bin.findByIdAndUpdate(req.params.id, { feedback, imageUrl }, { new: true });
    if (!bin) return res.status(404).json({ message: 'Bin not found' });
    console.log(`[MONITORING] Driver submitted feedback for Bin ${bin.location}`);
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark bin as collected
// @route   PUT /api/bins/:id/collect
exports.markCollected = async (req, res) => {
  try {
    const bin = await Bin.findByIdAndUpdate(req.params.id, { 
      isCollected: true, 
      fillLevel: 0, 
      status: 'Normal' 
    }, { new: true });
    if (!bin) return res.status(404).json({ message: 'Bin not found' });
    console.log(`[MONITORING] Driver marked Bin ${bin.location} as COLLECTED`);
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
