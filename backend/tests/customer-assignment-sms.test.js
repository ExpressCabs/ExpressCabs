const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../services/dispatch/customerAssignmentSms');
const smsPath = require.resolve('../services/sms/smsService');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

test('customer assignment SMS uses smsService once and missing phone is harmless', async (t) => {
  const smsRequests = [];
  require.cache[smsPath] = {
    id: smsPath,
    filename: smsPath,
    loaded: true,
    exports: {
      send: async (request) => {
        smsRequests.push(request);
        return { success: true, provider: 'clicksend' };
      },
    },
  };
  clearModule(servicePath);
  t.after(() => {
    clearModule(servicePath);
    clearModule(smsPath);
  });
  const { sendCustomerAssignmentSmsIfNeeded } = require('../services/dispatch/customerAssignmentSms');
  const audits = [];
  const fakePrisma = {
    dispatchJob: { update: async ({ data }) => data },
    dispatchAudit: { create: async ({ data }) => { audits.push(data); return data; } },
  };

  const sent = await sendCustomerAssignmentSmsIfNeeded(fakePrisma, {
    id: 12,
    customerPhone: '+61411111111',
    selectedDriverUnit: 'U2739',
    selectedDriverVehicle: 'White Camry',
    driverEtaMinutes: 8,
  });
  assert.equal(sent.sent, true);
  assert.equal(smsRequests.length, 1);
  assert.equal(smsRequests[0].to, '+61411111111');

  const missing = await sendCustomerAssignmentSmsIfNeeded(fakePrisma, {
    id: 13,
    originalDescription: 'no phone here',
    selectedDriverUnit: 'U2739',
    selectedDriverVehicle: 'White Camry',
    driverEtaMinutes: 8,
  });
  assert.equal(missing.sent, false);
  assert.equal(audits.some((entry) => entry.eventType === 'CUSTOMER_SMS_SKIPPED'), true);
});
