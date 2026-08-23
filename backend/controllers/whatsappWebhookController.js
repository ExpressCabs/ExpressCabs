const { handleWebhookPayload, verifyWebhook } = require('../services/whatsapp/whatsappWebhookService');

exports.verifyWhatsAppWebhook = (req, res) => {
  const result = verifyWebhook(req.query || {});
  if (!result.ok) return res.sendStatus(403);
  return res.status(200).send(result.challenge);
};

exports.receiveWhatsAppWebhook = async (req, res) => {
  try {
    await handleWebhookPayload(req.body || {});
    return res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp webhook processing failed:', error);
    return res.sendStatus(200);
  }
};
