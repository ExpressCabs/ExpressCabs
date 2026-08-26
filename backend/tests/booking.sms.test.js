const test = require('node:test');
const assert = require('node:assert/strict');

const rideControllerPath = require.resolve('../controllers/rideController');
const prismaModulePath = require.resolve('../lib/prisma');
const mailerModulePath = require.resolve('../lib/mailer');
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

const bookingBody = {
  name: 'Test Rider',
  phone: '0400000001',
  email: 'rider@example.com',
  pickup: 'Melbourne CBD',
  pickupLat: -37.8136,
  pickupLng: 144.9631,
  dropoff: 'Melbourne Airport',
  dropoffLat: -37.669,
  dropoffLng: 144.841,
  rideDate: '2026-08-22T21:30:00.000Z',
  passengerCount: 2,
  vehicleType: 'Sedan',
  fare: 75,
  fareType: 'fixed',
  siteKey: 'prime_cabs_melbourne',
};

const loadBookRide = (t, { smsSend }) => {
  const fakeRide = {
    id: 1001,
    createdAt: new Date('2026-08-22T00:00:00.000Z'),
    ...bookingBody,
    rideDate: new Date(bookingBody.rideDate),
  };

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: {
      ride: {
        create: async () => fakeRide,
      },
      visitSession: {
        updateMany: async () => ({ count: 0 }),
      },
    },
  };
  require.cache[mailerModulePath] = {
    id: mailerModulePath,
    filename: mailerModulePath,
    loaded: true,
    exports: { getMailTransporter: () => ({ sendMail: async () => ({ accepted: ['ops@example.com'] }) }) },
  };
  require.cache[smsServicePath] = {
    id: smsServicePath,
    filename: smsServicePath,
    loaded: true,
    exports: { send: smsSend },
  };

  clearModule(rideControllerPath);
  t.after(() => {
    clearModule(rideControllerPath);
    clearModule(prismaModulePath);
    clearModule(mailerModulePath);
    clearModule(smsServicePath);
  });

  return require('../controllers/rideController').bookRide;
};

test('bookRide succeeds and sends booking confirmation through smsService', async (t) => {
  const smsRequests = [];
  const bookRide = loadBookRide(t, {
    smsSend: async (request) => {
      smsRequests.push(request);
      return { success: true, provider: 'clicksend', status: 'SUCCESS' };
    },
  });

  const res = createRes();
  await bookRide({ body: bookingBody }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.id, 1001);
  assert.equal(smsRequests.length, 1);
  assert.equal(smsRequests[0].to, '0400000001');
  assert.equal(smsRequests[0].type, 'BOOKING_CONFIRMATION');
  assert.equal(smsRequests[0].data.siteKey, 'prime_cabs_melbourne');
  assert.equal(smsRequests[0].metadata.rideId, 1001);
});

test('bookRide still succeeds when booking confirmation SMS fails', async (t) => {
  const bookRide = loadBookRide(t, {
    smsSend: async () => ({ success: false, provider: 'clicksend', error: 'provider unavailable' }),
  });

  const res = createRes();
  await bookRide({ body: bookingBody }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.id, 1001);
});
