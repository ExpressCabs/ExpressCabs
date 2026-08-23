const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBookingProposal, parseDriverDetails } = require('../services/whatsapp/ownerParsers');

test('driver detail parser handles one-line and multiline replies', () => {
  assert.deepEqual(parseDriverDetails('U2739 White Camry ETA 8 min'), {
    selectedDriverUnit: 'U2739',
    selectedDriverVehicle: 'White Camry',
    driverEtaMinutes: 8,
    selectedDriverPhone: null,
    selectedDriverName: null,
    missing: { unit: false, vehicle: false, eta: false },
  });

  const multiline = parseDriverDetails('U2739\nCamry\nETA 5');
  assert.equal(multiline.selectedDriverUnit, 'U2739');
  assert.equal(multiline.selectedDriverVehicle, 'Camry');
  assert.equal(multiline.driverEtaMinutes, 5);
});

test('driver detail parser does not invent missing unit or invalid ETA', () => {
  const parsed = parseDriverDetails('White Camry ETA soon');
  assert.equal(parsed.selectedDriverUnit, null);
  assert.equal(parsed.selectedDriverVehicle, 'White Camry');
  assert.equal(parsed.driverEtaMinutes, null);
  assert.equal(parsed.missing.unit, true);
});

test('booking proposal parser extracts conservative new booking fields', () => {
  const parsed = parseBookingProposal([
    'New booking tomorrow 5:30am',
    'John 0412 345 678',
    '23 Smith St Croydon to Melbourne Airport T2',
    '2 passengers',
    'Min $110',
    'Card',
  ].join('\n'), new Date('2026-08-23T10:00:00+10:00'));

  assert.equal(parsed.customerName, 'John');
  assert.equal(parsed.customerPhone, '+61412345678');
  assert.equal(parsed.pickup, '23 Smith St Croydon');
  assert.equal(parsed.dropoff, 'Melbourne Airport T2');
  assert.equal(parsed.passengerCount, 2);
  assert.equal(parsed.minimumFare, 110);
  assert.deepEqual(parsed.notes, ['Card']);
});
