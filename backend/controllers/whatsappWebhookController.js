const { handleWebhookPayload, verifyWebhook } = require('../services/whatsapp/whatsappWebhookService');

exports.verifyWhatsAppWebhook = (req, res) => {
  const result = verifyWebhook(req.query || {});
  if (!result.ok) return res.sendStatus(403);
  return res.status(200).send(result.challenge);
};

exports.receiveWhatsAppWebhook = (req, res) => {
  const payload = req.body || {};
  res.sendStatus(200);
  setImmediate(() => {
    handleWebhookPayload(payload).catch((error) => {
      console.error('WhatsApp webhook background processing failed:', error);
    });
  });
  return res;
};
