const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMessagesEndpoint, sendText } = require('../services/whatsapp/providers/metaCloudProvider');

const withEnv = async (updates, fn) => {
  const previous = {};
  for (const key of Object.keys(updates)) {
    previous[key] = process.env[key];
    process.env[key] = updates[key];
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(updates)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
};

test('Meta WhatsApp provider posts expected text payload', async () => {
  const requests = [];
  await withEnv({
    WHATSAPP_ACCESS_TOKEN: 'meta-token',
    WHATSAPP_PHONE_NUMBER_ID: '12345',
    WHATSAPP_GRAPH_API_VERSION: 'v20.0',
  }, async () => {
    const result = await sendText({ to: '+61400000001', body: 'Hello owner' }, {
      fetchImpl: async (url, options) => {
        requests.push({ url, options });
        return {
          ok: true,
          json: async () => ({ messages: [{ id: 'wamid.abc', message_status: 'accepted' }] }),
        };
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.providerMessageId, 'wamid.abc');
    assert.equal(requests[0].url, buildMessagesEndpoint({ graphVersion: 'v20.0', phoneNumberId: '12345' }));
    assert.equal(requests[0].options.headers.Authorization, 'Bearer meta-token');
    const payload = JSON.parse(requests[0].options.body);
    assert.equal(payload.messaging_product, 'whatsapp');
    assert.equal(payload.to, '+61400000001');
    assert.equal(payload.text.body, 'Hello owner');
  });
});

test('Meta WhatsApp provider handles non-2xx without leaking access token', async () => {
  await withEnv({
    WHATSAPP_ACCESS_TOKEN: 'secret-token',
    WHATSAPP_PHONE_NUMBER_ID: '12345',
  }, async () => {
    const result = await sendText({ to: '+61400000001', body: 'Hello' }, {
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'bad secret-token' } }),
      }),
    });

    assert.equal(result.success, false);
    assert.equal(JSON.stringify(result).includes('secret-token'), false);
  });
});
