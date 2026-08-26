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
  assert.equal(parsed.fareType, 'MINIMUM');
  assert.equal(parsed.fareAmount, 110);
  assert.equal(parsed.paymentMethod, 'CARD');
  assert.deepEqual(parsed.notes, []);
});

test('booking parser handles p/d shorthand and natural route text', () => {
  const now = new Date('2026-08-26T10:00:00+10:00');
  const structured = parseBookingProposal(
    'p: 1 Main St Croydon d: airport tomorrow 5pm, 2 pax, min 75, cabcharge, customer has steep driveway',
    now
  );
  assert.equal(structured.pickup, '1 Main St Croydon');
  assert.equal(structured.dropoff, 'Melbourne Airport');
  assert.equal(structured.fareType, 'MINIMUM');
  assert.equal(structured.fareAmount, 75);
  assert.equal(structured.paymentMethod, 'CABCHARGE');
  assert.deepEqual(structured.notes, ['steep driveway']);
  assert.deepEqual(structured.missing, []);
  assert.equal(structured.pickupAt.toISOString(), '2026-08-27T07:00:00.000Z');

  const natural = parseBookingProposal('Croydon to airport tomorrow 5am 2 pax cash', now);
  assert.equal(natural.pickup, 'Croydon');
  assert.equal(natural.dropoff, 'Melbourne Airport');
  assert.equal(natural.paymentMethod, 'CASH');
  assert.equal(natural.pickupAt.toISOString(), '2026-08-26T19:00:00.000Z');
});

test('driver parser handles digit-letter units, job IDs, and Melbourne clock-time ETA', () => {
  const clockReply = parseDriverDetails('7258M white kluger 12:40am', new Date('2026-08-27T00:15:00+10:00'));
  assert.equal(clockReply.selectedDriverUnit, '7258M');
  assert.equal(clockReply.selectedDriverVehicle, 'White Kluger');
  assert.equal(clockReply.driverEtaMinutes, 25);

  const explicit = parseDriverDetails('Job 14 7258M white kluger ETA 12');
  assert.equal(explicit.selectedDriverUnit, '7258M');
  assert.equal(explicit.driverEtaMinutes, 12);
});
