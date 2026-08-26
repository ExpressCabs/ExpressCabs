const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAiBooking } = require('../services/whatsapp/ollamaBookingParser');

test('Ollama booking output is normalized and invented/invalid values are rejected', () => {
  const parsed = validateAiBooking({
    intent: 'CREATE_BOOKING',
    pickup: 'Croydon',
    dropoff: 'airport',
    pickupAt: '2026-08-27T05:00:00+10:00',
    passengerCount: 2,
    customerPhone: '0412 345 678',
    fareType: 'MADE_UP',
    fareAmount: 999,
    paymentMethod: 'CASH',
    notes: 'steep driveway',
  });

  assert.equal(parsed.dropoff, 'Melbourne Airport');
  assert.equal(parsed.customerPhone, '+61412345678');
  assert.equal(parsed.fareType, null);
  assert.equal(parsed.fareAmount, null);
  assert.equal(parsed.paymentMethod, 'CASH');
  assert.deepEqual(parsed.missing, []);
});

test('Ollama output cannot bypass booking intent validation', () => {
  assert.equal(validateAiBooking({ intent: 'CONFIRM', pickup: 'Croydon' }), null);
});
