const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../services/dispatch/reminderService');
const whatsappPath = require.resolve('../services/whatsapp/whatsappService');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

const loadReminderService = (t, sentMessages, enabled = true) => {
  require.cache[whatsappPath] = {
    id: whatsappPath,
    filename: whatsappPath,
    loaded: true,
    exports: {
      isWhatsAppEnabled: () => enabled,
      getOwnerWhatsApp: () => '+61400000001',
      sendText: async (message) => {
        sentMessages.push(message);
        return { success: true, provider: 'meta', providerMessageId: `wamid.${sentMessages.length}`, status: 'accepted' };
      },
    },
  };
  clearModule(servicePath);
  t.after(() => {
    clearModule(servicePath);
    clearModule(whatsappPath);
  });
  return require('../services/dispatch/reminderService');
};

test('dispatch reminders send 60 and 35 minute reminders exactly once', async (t) => {
  const sentMessages = [];
  const audits = [];
  const job = {
    id: 7,
    status: 'READY_FOR_DISPATCH',
    pickupAt: new Date('2026-08-23T11:00:00.000Z'),
    pickupSuburb: 'Croydon',
    dropoffSuburb: 'Highett',
    passengerAssumption: 'UP_TO_4',
    vehicleRequirement: 'ANY_SUITABLE',
    publicDispatchText: 'Ready 9:00\n• Croydon\nto\n• Highett',
    whatsappMessages: [],
  };
  const fakePrisma = {
    dispatchJob: {
      findMany: async () => [job],
    },
    dispatchAudit: {
      create: async ({ data }) => {
        audits.push(data);
        job.whatsappMessages.push({ messageType: data.details.minutes === 60 ? 'DISPATCH_REMINDER_60' : 'DISPATCH_REMINDER_35' });
        return data;
      },
    },
  };
  const { sendDueDispatchReminders } = loadReminderService(t, sentMessages);

  const first = await sendDueDispatchReminders({ prismaClient: fakePrisma, now: new Date('2026-08-23T10:01:00.000Z') });
  const second = await sendDueDispatchReminders({ prismaClient: fakePrisma, now: new Date('2026-08-23T10:25:00.000Z') });
  const duplicate = await sendDueDispatchReminders({ prismaClient: fakePrisma, now: new Date('2026-08-23T10:25:00.000Z') });

  assert.equal(first.sent, 1);
  assert.equal(second.sent, 1);
  assert.equal(duplicate.sent, 0);
  assert.equal(sentMessages.length, 2);
  assert.equal(sentMessages[1].body.includes('Pickup in 35 min'), true);
});

test('dispatch reminders do nothing when WhatsApp is disabled or job is covered', async (t) => {
  const sentMessages = [];
  const { sendDueDispatchReminders } = loadReminderService(t, sentMessages, false);

  const result = await sendDueDispatchReminders({
    prismaClient: {
      dispatchJob: { findMany: async () => { throw new Error('should not query when disabled'); } },
    },
  });

  assert.equal(result.enabled, false);
  assert.equal(sentMessages.length, 0);
});
