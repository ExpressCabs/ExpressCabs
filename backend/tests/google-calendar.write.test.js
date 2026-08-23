const test = require('node:test');
const assert = require('node:assert/strict');

const calendarPath = require.resolve('../services/dispatch/googleCalendarClient');

const clearModule = (modulePath) => {
  delete require.cache[modulePath];
};

const withEnv = async (updates, fn) => {
  const previous = {};
  for (const key of Object.keys(updates)) {
    previous[key] = process.env[key];
    process.env[key] = updates[key];
  }
  clearModule(calendarPath);
  try {
    await fn(require('../services/dispatch/googleCalendarClient'));
  } finally {
    clearModule(calendarPath);
    for (const key of Object.keys(updates)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
};

test('Google Calendar create and update use official endpoints and timezone payload', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    if (url.includes('oauth2.googleapis.com')) {
      return { ok: true, json: async () => ({ access_token: 'access', expires_in: 3600 }) };
    }
    return { ok: true, json: async () => ({ id: 'event-1' }) };
  };

  await withEnv({
    GOOGLE_CALENDAR_ID: 'primary',
    GOOGLE_CLIENT_ID: 'client',
    GOOGLE_CLIENT_SECRET: 'secret',
    GOOGLE_REFRESH_TOKEN: 'refresh',
    GOOGLE_CALENDAR_TIMEZONE: 'Australia/Melbourne',
  }, async ({ createCalendarEvent, updateCalendarEvent }) => {
    await createCalendarEvent({
      title: 'Croydon - Melbourne Airport',
      description: 'Pickup: 10 Example St Croydon',
      startTime: '2026-08-24T05:30:00+10:00',
    }, { fetchImpl });
    await updateCalendarEvent('event-1', { description: 'Updated' }, { fetchImpl });

    const createPayload = JSON.parse(requests[1].options.body);
    assert.equal(requests[1].options.method, 'POST');
    assert.equal(createPayload.start.timeZone, 'Australia/Melbourne');
    assert.equal(createPayload.summary, 'Croydon - Melbourne Airport');
    assert.equal(requests[2].options.method, 'PATCH');
    assert.equal(requests[2].url.includes('/events/event-1'), true);
  });
});
