const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLICKSEND_SMS_ENDPOINT,
  buildAuthHeader,
  send,
} = require('../services/sms/providers/clicksendProvider');

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
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
};

test('ClickSend provider posts the expected authenticated payload', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        response_code: 'SUCCESS',
        data: {
          messages: [
            {
              message_id: 'clicksend-1',
              status: 'SUCCESS',
              message_price: '0.055',
            },
          ],
        },
      }),
    };
  };

  await withEnv({
    CLICKSEND_USERNAME: 'api-user',
    CLICKSEND_API_KEY: 'api-key',
    SMS_SOURCE: 'primecabs-booking',
  }, async () => {
    const result = await send({
      to: '+61400000001',
      message: 'Prime Cabs: Booking confirmed.',
      metadata: { rideId: 22 },
    }, { fetchImpl });

    assert.equal(result.success, true);
    assert.equal(result.provider, 'clicksend');
    assert.equal(result.providerMessageId, 'clicksend-1');
    assert.equal(requests[0].url, CLICKSEND_SMS_ENDPOINT);
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(requests[0].options.headers.Authorization, buildAuthHeader({
      username: 'api-user',
      apiKey: 'api-key',
    }));
    assert.equal(requests[0].options.headers['Content-Type'], 'application/json');

    const payload = JSON.parse(requests[0].options.body);
    assert.deepEqual(payload.messages, [
      {
        source: 'primecabs-booking',
        body: 'Prime Cabs: Booking confirmed.',
        to: '+61400000001',
        custom_string: 'ride:22',
      },
    ]);
  });
});

test('ClickSend provider handles non-2xx and network errors without leaking credentials', async () => {
  await withEnv({
    CLICKSEND_USERNAME: 'api-user',
    CLICKSEND_API_KEY: 'super-secret-key',
    SMS_SOURCE: 'primecabs-booking',
  }, async () => {
    const failed = await send({
      to: '+61400000001',
      message: 'Test',
    }, {
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ response_code: 'FAIL', response_msg: 'Unauthorized' }),
      }),
    });

    assert.equal(failed.success, false);
    assert.equal(failed.provider, 'clicksend');
    assert.equal(JSON.stringify(failed).includes('super-secret-key'), false);

    const network = await send({
      to: '+61400000001',
      message: 'Test',
    }, {
      fetchImpl: async () => {
        throw new Error('socket closed');
      },
    });

    assert.equal(network.success, false);
    assert.equal(network.error, 'socket closed');
    assert.equal(JSON.stringify(network).includes('super-secret-key'), false);
  });
});
