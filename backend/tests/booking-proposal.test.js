const test = require('node:test');
const assert = require('node:assert/strict');

const servicePath = require.resolve('../services/whatsapp/bookingProposalService');
const prismaPath = require.resolve('../lib/prisma');
const whatsappPath = require.resolve('../services/whatsapp/whatsappService');
const calendarPath = require.resolve('../services/dispatch/googleCalendarClient');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

const loadProposalService = (t, fakePrisma, sent = [], events = []) => {
  require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: fakePrisma };
  require.cache[whatsappPath] = {
    id: whatsappPath,
    filename: whatsappPath,
    loaded: true,
    exports: { sendText: async (message) => { sent.push(message); return { success: true }; } },
  };
  require.cache[calendarPath] = {
    id: calendarPath,
    filename: calendarPath,
    loaded: true,
    exports: { createCalendarEvent: async (event) => { events.push(event); return { id: 'cal-1' }; } },
  };
  clearModule(servicePath);
  t.after(() => {
    clearModule(servicePath);
    clearModule(prismaPath);
    clearModule(whatsappPath);
    clearModule(calendarPath);
  });
  return require('../services/whatsapp/bookingProposalService');
};

test('new booking proposal can be confirmed into a Calendar event or cancelled', async (t) => {
  let proposalId = 0;
  let proposal = null;
  const sent = [];
  const events = [];
  const fakePrisma = {
    dispatchBookingProposal: {
      findFirst: async () => proposal,
      create: async ({ data }) => {
        proposal = { id: ++proposalId, ...data };
        return proposal;
      },
      update: async ({ data }) => {
        proposal = { ...proposal, ...data };
        return proposal;
      },
    },
  };
  const { createOrUpdateProposal, confirmProposal, cancelProposal } = loadProposalService(t, fakePrisma, sent, events);

  const body = 'New booking tomorrow 5:30am\nJohn 0412 345 678\n23 Smith St Croydon to Melbourne Airport T2\n2 passengers\nMin $110\nCard';
  const created = await createOrUpdateProposal({ ownerPhone: '+61400000001', body, prismaClient: fakePrisma, now: new Date('2026-08-23T10:00:00+10:00') });
  assert.equal(created.status, 'PENDING');
  assert.equal(sent[0].messageType, 'BOOKING_PROPOSAL_SUMMARY');

  const confirmed = await confirmProposal({ ownerPhone: '+61400000001', prismaClient: fakePrisma, now: new Date('2026-08-23T10:00:00+10:00') });
  assert.equal(confirmed.status, 'CONFIRMED');
  assert.equal(events.length, 1);
  assert.equal(events[0].description.includes('Original owner WhatsApp:'), true);

  proposal.status = 'PENDING';
  const cancelled = await cancelProposal({ ownerPhone: '+61400000001', prismaClient: fakePrisma, now: new Date('2026-08-23T10:00:00+10:00') });
  assert.equal(cancelled.status, 'CANCELLED');
});
