const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const prismaModulePath = require.resolve('../lib/prisma');
const controllerModulePath = require.resolve('../controllers/analyticsController');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

test('session/start creates a google_paid session from gclid input', async () => {
  const captured = {
    sessionCreate: null,
    sessionEventCreate: null,
  };

  const fakePrisma = {
    visitSession: {
      findUnique: async ({ where }) => {
        if (where.sessionToken === 'session-123') return null;
        if (where.id === 101) {
          return {
            id: 101,
            visitorId: 11,
            startedAt: new Date('2026-03-18T10:00:00.000Z'),
            endedAt: null,
            landingPath: '/airport-taxi-melbourne?gclid=test123',
            geoCity: null,
            geoRegion: null,
            geoCountry: 'au',
            timezone: 'Australia/Melbourne',
            ipHash: 'hash-1',
            sourceType: 'google_paid',
            userAgent: 'Mozilla/5.0',
            attributedRideId: null,
          };
        }
        return null;
      },
      create: async ({ data }) => {
        captured.sessionCreate = data;
        return { id: 101, visitorId: 11, ...data };
      },
      update: async ({ data }) => ({ id: 101, attributedRideId: null, ...captured.sessionCreate, ...data }),
      findMany: async () => [],
      count: async () => 0,
      updateMany: async () => ({ count: 0 }),
    },
    visitor: {
      upsert: async () => ({ id: 11, visitorToken: 'visitor-123' }),
    },
    visitEvent: {
      create: async ({ data }) => {
        if (!captured.sessionEventCreate) captured.sessionEventCreate = data;
        return data;
      },
      findMany: async () => [
        {
          eventName: 'session_started',
          eventTime: new Date('2026-03-18T10:00:00.000Z'),
          pickupSuburb: null,
          dropoffSuburb: null,
          isAirportPickup: false,
          isAirportDropoff: false,
          metadataJson: null,
        },
      ],
    },
    trafficBlockSignal: {
      upsert: async () => ({}),
    },
    $transaction: async () => [],
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
      visitorToken: 'visitor-123',
      sessionToken: 'session-123',
      landingUrl: 'https://expresscabs.onrender.com/airport-taxi-melbourne?gclid=test123',
      landingPath: '/airport-taxi-melbourne?gclid=test123',
      gclid: 'test123',
      referrer: '',
      timezone: 'Australia/Melbourne',
      screenWidth: 1440,
    },
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  };

  const res = {
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
  };

  await startSession(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.sourceType, 'google_paid');
  assert.equal(captured.sessionCreate.sourceType, 'google_paid');
  assert.equal(captured.sessionCreate.gclid, 'test123');
  assert.equal(captured.sessionCreate.sourceClassificationReason, 'gclid');

  clearModule(controllerModulePath);
  clearModule(prismaModulePath);
});
