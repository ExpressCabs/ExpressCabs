const test = require('node:test');
const assert = require('node:assert/strict');

const { SMS_MESSAGE_TYPES, buildSmsMessage } = require('../services/sms/smsTemplates');

const bookingData = {
  pickup: 'Melbourne CBD',
  dropoff: 'Melbourne Airport',
  formattedTime: '27/08/2026, 8:30 am',
};

test('Local Taxi booking confirmation uses the Local Taxi contact number', () => {
  const message = buildSmsMessage({
    type: SMS_MESSAGE_TYPES.BOOKING_CONFIRMATION,
    data: { ...bookingData, siteKey: 'local_taxi_melbourne' },
  });

  assert.match(message, /^No reply - Booking confirmed\./);
  assert.match(message, /call 0433 042 217\.$/);
  assert.doesNotMatch(message, /0488 797 233/);
});

test('Prime Cabs booking confirmation uses the Prime Cabs contact number', () => {
  const message = buildSmsMessage({
    type: SMS_MESSAGE_TYPES.BOOKING_CONFIRMATION,
    data: { ...bookingData, siteKey: 'prime_cabs_melbourne' },
  });

  assert.match(message, /^No reply - Booking confirmed\./);
  assert.match(message, /call 0488 797 233\.$/);
  assert.doesNotMatch(message, /0433 042 217/);
});
