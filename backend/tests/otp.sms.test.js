const test = require('node:test');
const assert = require('node:assert/strict');

const otpControllerPath = require.resolve('../controllers/otpController');
const smsServicePath = require.resolve('../services/sms/smsService');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

const createRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const loadOtpController = (t, smsSend) => {
  require.cache[smsServicePath] = {
    id: smsServicePath,
    filename: smsServicePath,
    loaded: true,
    exports: { send: smsSend },
  };

  clearModule(otpControllerPath);
  t.after(() => {
    clearModule(otpControllerPath);
    clearModule(smsServicePath);
  });

  return require('../controllers/otpController');
};

test('sendOtp delivers OTP through smsService', async (t) => {
  const smsRequests = [];
  const { sendOtp } = loadOtpController(t, async (request) => {
    smsRequests.push(request);
    return { success: true, provider: 'clicksend', status: 'SUCCESS' };
  });

  const res = createRes();
  await sendOtp({ body: { phone: '0400 000 001' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, message: 'OTP sent to your phone' });
  assert.equal(smsRequests.length, 1);
  assert.equal(smsRequests[0].to, '+61400000001');
  assert.equal(smsRequests[0].type, 'OTP_VERIFICATION');
  assert.match(smsRequests[0].data.otp, /^\d{6}$/);
  assert.equal(JSON.stringify(smsRequests[0]).includes('SmsMessage'), false);
});

test('sendOtp preserves existing failure semantics when provider is unavailable', async (t) => {
  const { sendOtp } = loadOtpController(t, async () => ({
    success: false,
    provider: 'clicksend',
    error: 'ClickSend SMS provider is not configured',
  }));

  const res = createRes();
  await sendOtp({ body: { phone: '0400000001' } }, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'OTP service is not configured' });
});
