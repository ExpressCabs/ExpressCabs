const express = require('express');
const router = express.Router();
const {
  receiveWhatsAppWebhook,
  verifyWhatsAppWebhook,
} = require('../controllers/whatsappWebhookController');

router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', receiveWhatsAppWebhook);

module.exports = router;
