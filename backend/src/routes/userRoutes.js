const express = require('express');
const router = express.Router();
const { getDrivers } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/drivers', protect, authorize('admin'), getDrivers);

module.exports = router;
