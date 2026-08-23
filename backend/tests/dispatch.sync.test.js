const test = require('node:test');
const assert = require('node:assert/strict');
const { syncCalendarEvent } = require('../services/dispatch/dispatchSyncService');

const calendarEvent = {
  id: 'event-abc',
  summary: 'Mooroolbark - Wantirna Sth',
  description: '23 delville st mooroolbark to 76 cathies ln wantirna sth meter early 1.5km 25$\ncard',
  start: { dateTime: '2026-08-23T13:30:00+10:00' },
  updated: '2026-08-22T00:00:00.000Z',
};

const createFakePrisma = () => {
  const jobs = new Map();
  const audits = [];
  return {
    jobs,
    audits,
    dispatchJob: {
      findUnique: async ({ where }) => jobs.get(where.calendarEventId) || null,
      create: async ({ data }) => {
        const job = { id: jobs.size + 1, ...data };
        jobs.set(job.calendarEventId, job);
        return job;
      },
      update: async ({ where, data }) => {
        const existing = [...jobs.values()].find((job) => job.id === where.id);
        const updated = { ...existing, ...data };
        jobs.set(updated.calendarEventId, updated);
        return updated;
      },
    },
    dispatchAudit: {
      create: async ({ data }) => {
        audits.push(data);
        return data;
      },
    },
  };
};

test('calendar sync creates one DispatchJob and duplicate polling does not duplicate', async () => {
  const fakePrisma = createFakePrisma();

  const first = await syncCalendarEvent(calendarEvent, { prismaClient: fakePrisma });
  const second = await syncCalendarEvent(calendarEvent, { prismaClient: fakePrisma });

  assert.equal(first.action, 'created');
  assert.equal(second.action, 'unchanged');
  assert.equal(fakePrisma.jobs.size, 1);
  assert.equal(fakePrisma.audits.length, 1);
});

test('calendar sync updates linked job when event description changes', async () => {
  const fakePrisma = createFakePrisma();
  await syncCalendarEvent(calendarEvent, { prismaClient: fakePrisma });
  const changed = await syncCalendarEvent({
    ...calendarEvent,
    description: `${calendarEvent.description}\nReceipt inbox`,
    updated: '2026-08-22T01:00:00.000Z',
  }, { prismaClient: fakePrisma });

  assert.equal(changed.action, 'updated');
  assert.equal(fakePrisma.jobs.size, 1);
  assert.equal(fakePrisma.audits.length, 2);
});

test('recurring calendar instances are unique by event instance id', async () => {
  const fakePrisma = createFakePrisma();
  await syncCalendarEvent({ ...calendarEvent, id: 'series_20260823', recurringEventId: 'series' }, { prismaClient: fakePrisma });
  await syncCalendarEvent({ ...calendarEvent, id: 'series_20260824', recurringEventId: 'series' }, { prismaClient: fakePrisma });

  assert.equal(fakePrisma.jobs.size, 2);
});
