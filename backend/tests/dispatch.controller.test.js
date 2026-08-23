const test = require('node:test');
const assert = require('node:assert/strict');

const controllerPath = require.resolve('../controllers/dispatchController');
const prismaPath = require.resolve('../lib/prisma');
const syncPath = require.resolve('../services/dispatch/dispatchSyncService');
const googlePath = require.resolve('../services/dispatch/googleCalendarClient');

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

const loadController = (t, fakePrisma) => {
  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: fakePrisma,
  };
  require.cache[syncPath] = {
    id: syncPath,
    filename: syncPath,
    loaded: true,
    exports: { syncUpcomingCalendarEvents: async () => ({ enabled: true, created: 1, updated: 0, unchanged: 0, total: 1 }) },
  };
  require.cache[googlePath] = {
    id: googlePath,
    filename: googlePath,
    loaded: true,
    exports: {
      isCalendarEnabled: () => true,
      getCalendarConfig: () => ({ calendarId: 'primary', timezone: 'Australia/Melbourne', lookaheadHours: 168 }),
    },
  };

  clearModule(controllerPath);
  t.after(() => {
    clearModule(controllerPath);
    clearModule(prismaPath);
    clearModule(syncPath);
    clearModule(googlePath);
  });
  return require('../controllers/dispatchController');
};

test('dispatch admin controller returns upcoming jobs and detail', async (t) => {
  const job = {
    id: 4,
    status: 'READY_FOR_DISPATCH',
    pickupAt: new Date('2026-08-23T03:30:00.000Z'),
    auditEvents: [],
  };
  const controller = loadController(t, {
    dispatchJob: {
      findMany: async () => [job],
      findUnique: async () => job,
    },
  });

  const listRes = createRes();
  await controller.getDispatchJobs({ query: {} }, listRes);
  assert.equal(listRes.statusCode, 200);
  assert.equal(listRes.body.jobs.length, 1);

  const detailRes = createRes();
  await controller.getDispatchJob({ params: { id: '4' } }, detailRes);
  assert.equal(detailRes.statusCode, 200);
  assert.equal(detailRes.body.job.id, 4);
});

test('dispatch admin controller handles manual state actions', async (t) => {
  const calls = [];
  const controller = loadController(t, {
    dispatchJob: {
      findUnique: async () => ({ id: 4, status: 'READY_FOR_DISPATCH', dispatchedMainAt: null }),
      update: async ({ data }) => ({ id: 4, status: data.status }),
    },
    dispatchAudit: {
      create: async ({ data }) => {
        calls.push(data);
        return data;
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  });

  const res = createRes();
  await controller.transitionDispatchJobStatus({
    params: { id: '4' },
    body: { status: 'MAIN_DISPATCHED' },
    admin: { sub: 1 },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.job.status, 'MAIN_DISPATCHED');
  assert.equal(calls[0].eventType, 'MANUAL_STATUS_CHANGE');
});
