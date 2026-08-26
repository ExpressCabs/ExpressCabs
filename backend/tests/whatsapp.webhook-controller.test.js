const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../controllers/whatsappWebhookController');
const servicePath = require.resolve('../services/whatsapp/whatsappWebhookService');

test('WhatsApp webhook acknowledges Meta before background processing', async (t) => {
  let processingStarted = false;
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      verifyWebhook: () => ({ ok: false }),
      handleWebhookPayload: async () => { processingStarted = true; },
    },
  };
  delete require.cache[controllerPath];
  t.after(() => {
    delete require.cache[controllerPath];
    delete require.cache[servicePath];
  });

  const { receiveWhatsAppWebhook } = require('../controllers/whatsappWebhookController');
  const res = {
    acknowledged: false,
    sendStatus(status) { this.acknowledged = status === 200; return this; },
  };
  receiveWhatsAppWebhook({ body: { entry: [] } }, res);
  assert.equal(res.acknowledged, true);
  assert.equal(processingStarted, false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(processingStarted, true);
});
