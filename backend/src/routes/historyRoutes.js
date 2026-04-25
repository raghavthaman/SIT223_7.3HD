const express = require('express');
const router = express.createElement ? express.Router() : express.Router();
const { getHistory } = require('../controllers/historyController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/:userId', protect, getHistory);

module.exports = router;
