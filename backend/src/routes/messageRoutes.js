const express = require('express');
const router = express.createElement ? express.Router() : express.Router();
const { sendMessage, getChat } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/send', protect, sendMessage);
router.get('/:user1/:user2', protect, getChat);

module.exports = router;
