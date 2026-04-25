const express = require('express');
const router = express.createElement ? express.Router() : express.Router();
const { getTruckStatus, getAllTrucks } = require('../controllers/truckController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getAllTrucks);
router.get('/:id/status', protect, getTruckStatus);

module.exports = router;
