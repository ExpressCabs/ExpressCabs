const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../services/whatsapp/whatsappWebhookService');
const prismaPath = require.resolve('../lib/prisma');
const whatsappServicePath = require.resolve('../services/whatsapp/whatsappService');
const customerSmsPath = require.resolve('../services/dispatch/customerAssignmentSms');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

const loadWebhookService = (t, fakePrisma, sentMessages = []) => {
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };
  require.cache[whatsappServicePath] = {
    id: whatsappServicePath,
    filename: whatsappServicePath,
    loaded: true,
    exports: {
      getOwnerWhatsApp: () => '+61400000001',
      sendText: async (message) => {
        sentMessages.push(message);
        return { success: true, provider: 'meta', providerMessageId: `wamid.out.${sentMessages.length}` };
      },
    },
  };
  require.cache[customerSmsPath] = {
    id: customerSmsPath,
    filename: customerSmsPath,
    loaded: true,
    exports: { sendCustomerAssignmentSmsIfNeeded: async () => ({ sent: true }) },
  };
  clearModule(servicePath);
  t.after(() => {
    clearModule(servicePath);
    clearModule(prismaPath);
    clearModule(whatsappServicePath);
    clearModule(customerSmsPath);
  });
  return require('../services/whatsapp/whatsappWebhookService');
};

test('webhook verification accepts correct token and rejects wrong token', () => {
  const previous = process.env.WHATSAPP_VERIFY_TOKEN;
  process.env.WHATSAPP_VERIFY_TOKEN = 'verify-me';
  const { verifyWebhook } = require('../services/whatsapp/whatsappWebhookService');

  assert.deepEqual(verifyWebhook({ 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '123' }), { ok: true, challenge: '123' });
  assert.deepEqual(verifyWebhook({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': '123' }), { ok: false });

  if (previous === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
  else process.env.WHATSAPP_VERIFY_TOKEN = previous;
});

test('owner reply resolves job by outbound provider message ID and updates assignment once', async (t) => {
  const inboundLogs = new Map();
  const audits = [];
  const fakeJob = {
    id: 123,
    status: 'READY_FOR_DISPATCH',
    selectedDriverUnit: null,
    selectedDriverVehicle: null,
    driverEtaMinutes: null,
    customerPhone: '+61411111111',
  };
  const fakePrisma = {
    whatsAppMessage: {
      findUnique: async ({ where }) => {
        if (where.providerMessageId === 'wamid.reminder') return { id: 1, dispatchJobId: 123 };
        return inboundLogs.get(where.providerMessageId) || null;
      },
      create: async ({ data }) => {
        const row = { id: inboundLogs.size + 10, ...data };
        inboundLogs.set(data.providerMessageId, row);
        return row;
      },
      update: async ({ where, data }) => ({ ...inboundLogs.get([...inboundLogs.keys()][0]), id: where.id, ...data }),
    },
    dispatchJob: {
      findUnique: async () => fakeJob,
      update: async ({ data }) => {
        Object.assign(fakeJob, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
        return fakeJob;
      },
    },
    dispatchAudit: {
      create: async ({ data }) => {
        audits.push(data);
        return data;
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  };
  const sentMessages = [];
  const { processOwnerMessage } = loadWebhookService(t, fakePrisma, sentMessages);

  const message = {
    providerMessageId: 'wamid.in.1',
    from: '+61400000001',
    replyToProviderMessageId: 'wamid.reminder',
    body: 'U2739 White Camry ETA 8 min',
  };
  const first = await processOwnerMessage(message, { prismaClient: fakePrisma });
  const duplicate = await processOwnerMessage(message, { prismaClient: fakePrisma });

  assert.equal(first.updated, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(fakeJob.selectedDriverUnit, 'U2739');
  assert.equal(fakeJob.selectedDriverVehicle, 'White Camry');
  assert.equal(fakeJob.driverEtaMinutes, 8);
  assert.equal(audits.some((entry) => entry.eventType === 'OWNER_DRIVER_DETAILS_PARSED'), true);
  assert.equal(sentMessages.some((entry) => entry.messageType === 'OWNER_ASSIGNMENT_ACK'), true);
});

test('non-owner inbound message cannot modify dispatch state', async (t) => {
  let jobUpdated = false;
  const fakePrisma = {
    whatsAppMessage: {
      create: async ({ data }) => data,
      findUnique: async () => null,
    },
    dispatchJob: {
      update: async () => {
        jobUpdated = true;
      },
    },
  };
  const { processOwnerMessage } = loadWebhookService(t, fakePrisma);

  const result = await processOwnerMessage({
    providerMessageId: 'wamid.bad',
    from: '+61499999999',
    body: 'Job 1 U2739 White Camry ETA 8 min',
  }, { prismaClient: fakePrisma });

  assert.equal(result.ignored, true);
  assert.equal(jobUpdated, false);
});

test('partial driver details retain job context and accept the missing unit alone', async (t) => {
  const inboundLogs = new Map();
  const sentMessages = [];
  const fakeJob = {
    id: 14,
    status: 'READY_FOR_DISPATCH',
    selectedDriverUnit: null,
    selectedDriverVehicle: null,
    driverEtaMinutes: null,
    customerPhone: null,
  };
  const fakePrisma = {
    whatsAppMessage: {
      findUnique: async ({ where }) => inboundLogs.get(where.providerMessageId) || null,
      findFirst: async () => sentMessages.some((message) => message.messageType === 'OWNER_CLARIFICATION')
        ? { dispatchJobId: 14 }
        : null,
      create: async ({ data }) => {
        const row = { id: inboundLogs.size + 1, ...data };
        inboundLogs.set(data.providerMessageId, row);
        return row;
      },
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
    dispatchJob: {
      findUnique: async () => fakeJob,
      update: async ({ data }) => {
        Object.assign(fakeJob, Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
        return fakeJob;
      },
    },
    dispatchAudit: { create: async ({ data }) => data },
    $transaction: async (operations) => Promise.all(operations),
  };
  const { processOwnerMessage } = loadWebhookService(t, fakePrisma, sentMessages);

  const partial = await processOwnerMessage({
    providerMessageId: 'wamid.partial',
    from: '+61400000001',
    body: 'Job 14 white kluger ETA 12',
  }, { prismaClient: fakePrisma });
  assert.equal(partial.needsDriverDetails, true);
  assert.deepEqual(partial.missing, ['taxi/unit number']);
  assert.equal(fakeJob.selectedDriverVehicle, 'White Kluger');
  assert.equal(fakeJob.driverEtaMinutes, 12);

  const completed = await processOwnerMessage({
    providerMessageId: 'wamid.unit',
    from: '+61400000001',
    body: '7258M',
  }, { prismaClient: fakePrisma });
  assert.equal(completed.updated, true);
  assert.equal(fakeJob.selectedDriverUnit, '7258M');
  assert.equal(fakeJob.status, 'COVERED');
});
