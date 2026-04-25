const express = require('express');
const router = express.createElement ? express.Router() : express.Router(); // Standard express router
const { getNotificationsByDriverId, createNotification, markAsRead, callDriver } = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/driver/:driverId', protect, authorize('driver'), getNotificationsByDriverId);
router.post('/', protect, authorize('admin'), createNotification);
router.put('/:id/read', protect, authorize('driver'), markAsRead);

module.exports = router;
