const test = require('node:test');
const assert = require('node:assert/strict');

const userControllerPath = require.resolve('../controllers/userController');
const driverControllerPath = require.resolve('../controllers/driverController');
const prismaModulePath = require.resolve('../lib/prisma');
const bcryptModulePath = require.resolve('bcrypt');
const twilioModulePath = require.resolve('twilio');
const mailerModulePath = require.resolve('../lib/mailer');

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

const mockBcrypt = {
  hash: async (password) => `hashed:${password}`,
  compare: async (password, hash) => hash === `hashed:${password}`,
};

const loadUserController = (t, fakePrisma) => {
  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: fakePrisma,
  };
  require.cache[bcryptModulePath] = {
    id: bcryptModulePath,
    filename: bcryptModulePath,
    loaded: true,
    exports: mockBcrypt,
  };
  require.cache[twilioModulePath] = {
    id: twilioModulePath,
    filename: twilioModulePath,
    loaded: true,
    exports: () => ({ messages: { create: async () => ({}) } }),
  };

  clearModule(userControllerPath);
  t.after(() => {
    clearModule(userControllerPath);
    clearModule(prismaModulePath);
    clearModule(bcryptModulePath);
    clearModule(twilioModulePath);
  });

  return require('../controllers/userController');
};

const userFixture = (overrides = {}) => ({
  id: 7,
  name: 'Test Rider',
  phone: '+61400000001',
  email: 'rider@example.com',
  createdAt: new Date('2026-08-22T00:00:00.000Z'),
  password: 'hashed:PrimeTest123',
  ...overrides,
});

test('registerUser stores Australian 04 mobile numbers in canonical +61 format', async (t) => {
  const captured = {};
  const fakePrisma = {
    user: {
      findUnique: async ({ where }) => {
        captured.findUniqueWhere = where;
        return null;
      },
      create: async ({ data, select }) => {
        captured.createData = data;
        captured.createSelect = select;
        return {
          id: 1,
          name: data.name,
          phone: data.phone,
          email: data.email,
          createdAt: new Date('2026-08-22T00:00:00.000Z'),
        };
      },
    },
  };
  const { registerUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await registerUser({
    body: {
      name: ' Test Rider ',
      phone: '0400 000 001',
      email: 'RIDER@EXAMPLE.COM',
      password: 'PrimeTest123',
    },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.equal(captured.findUniqueWhere.phone, '+61400000001');
  assert.equal(captured.createData.phone, '+61400000001');
  assert.equal(res.body.user.phone, '+61400000001');
  assert.equal(captured.createSelect.password, undefined);
});

test('normalizeAuPhone preserves Australian numbers supplied without plus prefix', () => {
  const { normalizeAuPhone } = require('../lib/validators');
  assert.equal(normalizeAuPhone('61400000001'), '+61400000001');
});

test('loginUser accepts 04 input for a canonically stored +61 user', async (t) => {
  const lookups = [];
  const fakePrisma = {
    user: {
      findUnique: async ({ where }) => {
        lookups.push(where.phone);
        return where.phone === '+61400000001' ? userFixture() : null;
      },
      update: async () => {
        throw new Error('update should not run for canonical users');
      },
    },
  };
  const { loginUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await loginUser({ body: { phone: '0400000001', password: 'PrimeTest123' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(lookups, ['+61400000001']);
  assert.equal(res.body.user.phone, '+61400000001');
  assert.equal(res.body.user.password, undefined);
});

test('loginUser accepts +61 input for a canonically stored +61 user', async (t) => {
  const fakePrisma = {
    user: {
      findUnique: async ({ where }) => (where.phone === '+61400000001' ? userFixture() : null),
      update: async () => {
        throw new Error('update should not run for canonical users');
      },
    },
  };
  const { loginUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await loginUser({ body: { phone: '+61400000001', password: 'PrimeTest123' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.phone, '+61400000001');
  assert.deepEqual(Object.keys(res.body), ['user']);
});

test('loginUser accepts a legacy 04 database row and self-heals it after authentication', async (t) => {
  const lookups = [];
  const updates = [];
  const fakePrisma = {
    user: {
      findUnique: async ({ where }) => {
        lookups.push(where.phone);
        return where.phone === '0400000001' ? userFixture({ phone: '0400000001' }) : null;
      },
      update: async ({ where, data }) => {
        updates.push({ where, data });
        return userFixture({ id: where.id, phone: data.phone });
      },
    },
  };
  const { loginUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await loginUser({ body: { phone: '0400000001', password: 'PrimeTest123' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(lookups, ['+61400000001', '0400000001']);
  assert.deepEqual(updates, [{ where: { id: 7 }, data: { phone: '+61400000001' } }]);
  assert.equal(res.body.user.phone, '+61400000001');
  assert.equal(res.body.user.password, undefined);
});

test('loginUser still succeeds if legacy self-heal hits a unique constraint', async (t) => {
  const uniqueError = new Error('Unique constraint failed');
  uniqueError.code = 'P2002';
  const fakePrisma = {
    user: {
      findUnique: async ({ where }) => (where.phone === '0400000001' ? userFixture({ phone: '0400000001' }) : null),
      update: async () => {
        throw uniqueError;
      },
    },
  };
  const { loginUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await loginUser({ body: { phone: '0400000001', password: 'PrimeTest123' } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.phone, '0400000001');
  assert.equal(res.body.user.password, undefined);
});

test('loginUser rejects a wrong password with the existing 401 response', async (t) => {
  let updateCalled = false;
  const fakePrisma = {
    user: {
      findUnique: async ({ where }) => (where.phone === '+61400000001' ? userFixture() : null),
      update: async () => {
        updateCalled = true;
      },
    },
  };
  const { loginUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await loginUser({ body: { phone: '0400000001', password: 'WrongPassword' } }, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid credentials' });
  assert.equal(updateCalled, false);
});

test('loginUser keeps the existing missing-field validation response', async (t) => {
  const fakePrisma = {
    user: {
      findUnique: async () => {
        throw new Error('lookup should not run for invalid requests');
      },
    },
  };
  const { loginUser } = loadUserController(t, fakePrisma);

  const res = createRes();
  await loginUser({ body: { phone: '0400000001', password: '' } }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Phone and password are required' });
});

test('loginDriver remains email-based and returns the existing driver response shape', async (t) => {
  const captured = {};
  const fakePrisma = {
    driver: {
      findUnique: async ({ where }) => {
        captured.where = where;
        return {
          id: 3,
          name: 'Driver One',
          email: 'driver@example.com',
          phone: '0400000002',
          dcNumber: 'DC123',
          taxiReg: 'M1234',
          carModel: 'Camry',
          password: 'hashed:DriverPass123',
        };
      },
    },
  };

  require.cache[prismaModulePath] = {
    id: prismaModulePath,
    filename: prismaModulePath,
    loaded: true,
    exports: fakePrisma,
  };
  require.cache[bcryptModulePath] = {
    id: bcryptModulePath,
    filename: bcryptModulePath,
    loaded: true,
    exports: mockBcrypt,
  };
  require.cache[mailerModulePath] = {
    id: mailerModulePath,
    filename: mailerModulePath,
    loaded: true,
    exports: { getMailTransporter: () => ({ sendMail: async () => ({}) }) },
  };

  clearModule(driverControllerPath);
  t.after(() => {
    clearModule(driverControllerPath);
    clearModule(prismaModulePath);
    clearModule(bcryptModulePath);
    clearModule(mailerModulePath);
  });

  const { loginDriver } = require('../controllers/driverController');
  const res = createRes();
  await loginDriver({ body: { email: ' DRIVER@EXAMPLE.COM ', password: 'DriverPass123' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(captured.where, { email: 'driver@example.com' });
  assert.deepEqual(Object.keys(res.body), ['driver']);
  assert.equal(res.body.driver.password, undefined);
});
