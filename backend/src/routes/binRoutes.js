const express = require('express');
const router = express.Router();
const {
  getBins,
  getBinById,
  createBin,
  updateBin,
  assignDriver,
  submitFeedback,
  markCollected
} = require('../controllers/binController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getBins)
  .post(protect, authorize('admin'), createBin);

router.route('/:id')
  .get(protect, getBinById)
  .put(protect, authorize('admin'), updateBin);

router.route('/:id/assign').put(protect, authorize('admin'), assignDriver);
router.route('/:id/feedback').put(protect, authorize('driver', 'admin'), submitFeedback);
router.route('/:id/collect').put(protect, authorize('driver', 'admin'), markCollected);

module.exports = router;
