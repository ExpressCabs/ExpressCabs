const test = require('node:test');
const assert = require('node:assert/strict');

const smsServicePath = require.resolve('../services/sms/smsService');
const clicksendProviderPath = require.resolve('../services/sms/providers/clicksendProvider');
const twilioProviderPath = require.resolve('../services/sms/providers/twilioProvider');
const prismaModulePath = require.resolve('../lib/prisma');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

const withEnv = async (updates, fn) => {
  const previous = {};
  for (const key of Object.keys(updates)) {
    previous[key] = process.env[key];
    if (updates[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = updates[key];
    }
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

const loadSmsService = ({ fakePrisma, clicksendSend, twilioSend }) => {
  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: fakePrisma,
  };
  require.cache[clicksendProviderPath] = {
    id: clicksendProviderPath,
    filename: clicksendProviderPath,
    loaded: true,
    exports: { send: clicksendSend },
  };
  require.cache[twilioProviderPath] = {
    id: twilioProviderPath,
    filename: twilioProviderPath,
    loaded: true,
    exports: { send: twilioSend },
  };

  clearModule(smsServicePath);
  return require('../services/sms/smsService');
};

test('smsService chooses ClickSend when SMS_PROVIDER=clicksend and logs success', async (t) => {
  const logs = [];
  const service = loadSmsService({
    fakePrisma: { smsMessage: { create: async ({ data }) => logs.push(data) } },
    clicksendSend: async ({ to, message }) => ({
      success: true,
      provider: 'clicksend',
      providerMessageId: 'cs-123',
      status: 'SUCCESS',
      cost: '0.045',
      to,
      message,
    }),
    twilioSend: async () => {
      throw new Error('twilio should not be selected');
    },
  });

  t.after(() => {
    clearModule(smsServicePath);
    clearModule(prismaModulePath);
    clearModule(clicksendProviderPath);
    clearModule(twilioProviderPath);
  });

  await withEnv({ SMS_PROVIDER: 'clicksend' }, async () => {
    const result = await service.send({
      to: '0400 000 001',
      type: 'BOOKING_CONFIRMATION',
      data: {
        pickup: 'Melbourne CBD',
        dropoff: 'Melbourne Airport',
        formattedTime: '22/08/2026, 8:30 am',
      },
      metadata: { rideId: 55 },
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, 'clicksend');
    assert.equal(result.providerMessageId, 'cs-123');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].recipient, '+61400000001');
    assert.equal(logs[0].rideId, 55);
    assert.equal(logs[0].messageType, 'BOOKING_CONFIRMATION');
    assert.equal(logs[0].cost, 0.045);
  });
});

test('smsService chooses Twilio when SMS_PROVIDER=twilio', async (t) => {
  const service = loadSmsService({
    fakePrisma: { smsMessage: { create: async () => {} } },
    clicksendSend: async () => {
      throw new Error('clicksend should not be selected');
    },
    twilioSend: async () => ({
      success: true,
      provider: 'twilio',
      providerMessageId: 'SM123',
      status: 'queued',
      cost: null,
    }),
  });

  t.after(() => {
    clearModule(smsServicePath);
    clearModule(prismaModulePath);
    clearModule(clicksendProviderPath);
    clearModule(twilioProviderPath);
  });

  await withEnv({ SMS_PROVIDER: 'twilio' }, async () => {
    const result = await service.send({
      to: '+61400000001',
      type: 'OTP_VERIFICATION',
      data: { otp: '123456' },
    });

    assert.equal(result.success, true);
    assert.equal(result.provider, 'twilio');
    assert.equal(result.providerMessageId, 'SM123');
  });
});

test('smsService handles invalid phones and provider failures consistently', async (t) => {
  const logs = [];
  const service = loadSmsService({
    fakePrisma: { smsMessage: { create: async ({ data }) => logs.push(data) } },
    clicksendSend: async () => ({
      success: false,
      provider: 'clicksend',
      error: 'Provider failed without auth details',
    }),
    twilioSend: async () => {
      throw new Error('twilio should not be selected');
    },
  });

  t.after(() => {
    clearModule(smsServicePath);
    clearModule(prismaModulePath);
    clearModule(clicksendProviderPath);
    clearModule(twilioProviderPath);
  });

  await withEnv({ SMS_PROVIDER: 'clicksend', CLICKSEND_API_KEY: 'super-secret' }, async () => {
    const invalid = await service.send({
      to: '123',
      type: 'OTP_VERIFICATION',
      data: { otp: '123456' },
    });
    assert.equal(invalid.success, false);
    assert.equal(invalid.error, 'Invalid Australian mobile number');

    const failed = await service.send({
      to: '+61400000001',
      type: 'OTP_VERIFICATION',
      data: { otp: '123456' },
    });
    assert.equal(failed.success, false);
    assert.equal(failed.provider, 'clicksend');
    assert.equal(failed.error.includes('super-secret'), false);
    assert.equal(logs.some((entry) => entry.messageType === 'OTP_VERIFICATION'), true);
    assert.equal(logs.some((entry) => JSON.stringify(entry).includes('123456')), false);
  });
});

test('smsService converts provider exceptions into safe failure results', async (t) => {
  const service = loadSmsService({
    fakePrisma: { smsMessage: { create: async () => {} } },
    clicksendSend: async () => {
      throw new Error('network failed with hidden-token');
    },
    twilioSend: async () => {
      throw new Error('twilio should not be selected');
    },
  });

  t.after(() => {
    clearModule(smsServicePath);
    clearModule(prismaModulePath);
    clearModule(clicksendProviderPath);
    clearModule(twilioProviderPath);
  });

  await withEnv({ SMS_PROVIDER: 'clicksend', CLICKSEND_API_KEY: 'hidden-token' }, async () => {
    const result = await service.send({
      to: '+61400000001',
      type: 'OTP_VERIFICATION',
      data: { otp: '123456' },
    });

    assert.equal(result.success, false);
    assert.equal(result.provider, 'clicksend');
    assert.equal(result.error.includes('hidden-token'), false);
  });
});
