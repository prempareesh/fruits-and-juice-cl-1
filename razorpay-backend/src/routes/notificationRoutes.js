const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/send-order', notificationController.sendOrderNotification);

module.exports = router;
