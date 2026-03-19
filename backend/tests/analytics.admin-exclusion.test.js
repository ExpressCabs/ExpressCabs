const test = require('node:test');
const assert = require('node:assert/strict');

const prismaModulePath = require.resolve('../lib/prisma');
const controllerModulePath = require.resolve('../controllers/analyticsController');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

test('session/start ignores admin landing paths', async () => {
  const fakePrisma = {
    visitSession: {
      findUnique: async () => null,
      create: async () => {
        throw new Error('visitSession.create should not run for admin traffic');
      },
    },
  };

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: fakePrisma,
  };

  clearModule(controllerModulePath);
  const { startSession } = require('../controllers/analyticsController');

  const req = {
    body: {
      visitorToken: 'visitor-admin',
      sessionToken: 'session-admin',
      landingUrl: 'https://expresscabs.onrender.com/admin',
      landingPath: '/admin',
    },
    path: '/session/start',
    originalUrl: '/api/analytics/session/start',
  };

  const res = {
    statusCode: 200,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };

  await startSession(req, res);

  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);

  clearModule(controllerModulePath);
  clearModule(prismaModulePath);
});

test('events/batch ignores admin event paths even when session exists', async () => {
  const fakePrisma = {
    visitSession: {
      findUnique: async () => ({
        id: 101,
        visitorId: 11,
        sessionToken: 'session-public',
        landingPath: '/',
        landingUrl: 'https://expresscabs.onrender.com/',
        sourceType: 'direct',
      }),
    },
    $transaction: async () => {
      throw new Error('transaction should not run for admin traffic');
    },
  };

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: fakePrisma,
  };

  clearModule(controllerModulePath);
  const { ingestEventsBatch } = require('../controllers/analyticsController');

  const req = {
    body: {
      sessionToken: 'session-public',
      events: [
        {
          eventName: 'page_view',
          path: '/admin/analytics',
        },
      ],
    },
    path: '/events/batch',
    originalUrl: '/api/analytics/events/batch',
  };

  const res = {
    statusCode: 200,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };

  await ingestEventsBatch(req, res);

  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);

  clearModule(controllerModulePath);
  clearModule(prismaModulePath);
});
