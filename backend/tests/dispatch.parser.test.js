const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCalendarBooking } = require('../lib/dispatch/parser');
const {
  buildPrivateDriverMessage,
  buildPublicDispatchMessage,
} = require('../lib/dispatch/messageBuilders');

test('dispatch parser handles the real Mooroolbark booking without inventing details', () => {
  const description = '23 delville st mooroolbark to 76 cathies ln wantirna sth meter early 1.5km 25$\ncard';
  const parsed = parseCalendarBooking({
    id: 'event-1',
    summary: 'Mooroolbark - Wantirna Sth',
    description,
    start: { dateTime: '2026-08-23T13:30:00+10:00' },
  });

  assert.equal(parsed.pickup, '23 delville st mooroolbark');
  assert.equal(parsed.dropoff, '76 cathies ln wantirna sth');
  assert.equal(parsed.pickupSuburb, 'Mooroolbark');
  assert.equal(parsed.dropoffSuburb, 'Wantirna South');
  assert.equal(parsed.passengerCount, null);
  assert.equal(parsed.passengerAssumption, 'UP_TO_4');
  assert.equal(parsed.luggage, null);
  assert.equal(parsed.vehicleRequirement, 'ANY_SUITABLE');
  assert.equal(parsed.minimumFare, null);
  assert.equal(parsed.originalDescription, description);
  assert.equal(parsed.status, 'READY_FOR_DISPATCH');
});

test('dispatch parser extracts clear structured fields only when explicit', () => {
  const description = [
    'Pickup: 10 Example St Croydon',
    'Dropoff: Melbourne Airport T2',
    'Passengers: 5',
    'Luggage: 4 large',
    'Min $110',
    'SUV/Maxi required',
    'Card',
    'Receipt inbox',
  ].join('\n');

  const parsed = parseCalendarBooking({
    summary: 'Croydon - Melbourne Airport',
    description,
    start: { dateTime: '2026-08-24T05:00:00+10:00' },
  });

  assert.equal(parsed.pickup, '10 Example St Croydon');
  assert.equal(parsed.dropoff, 'Melbourne Airport T2');
  assert.equal(parsed.passengerCount, 5);
  assert.equal(parsed.passengerAssumption, null);
  assert.equal(parsed.luggage, '4 large');
  assert.equal(parsed.vehicleRequirement, 'SUV_OR_MAXI');
  assert.equal(parsed.minimumFare, 110);
  assert.deepEqual(parsed.specialNotes, ['Card', 'Receipt inbox']);
});

test('dispatch parser marks uncertain jobs for review', () => {
  const parsed = parseCalendarBooking({
    summary: 'Unknown booking',
    description: 'call customer',
    start: { dateTime: '2026-08-24T05:00:00+10:00' },
  });

  assert.equal(parsed.status, 'NEEDS_REVIEW');
});

test('dispatch message builders separate public suburb text from private exact details', () => {
  const job = {
    pickupAt: new Date('2026-08-23T03:30:00.000Z'),
    pickup: '23 delville st mooroolbark',
    pickupSuburb: 'Mooroolbark',
    dropoff: '76 cathies ln wantirna sth',
    dropoffSuburb: 'Wantirna South',
    passengerCount: null,
    passengerAssumption: 'UP_TO_4',
    luggage: null,
    vehicleRequirement: 'ANY_SUITABLE',
    minimumFare: null,
    specialNotes: ['card'],
    originalDescription: '23 delville st mooroolbark to 76 cathies ln wantirna sth meter early 1.5km 25$\ncard',
  };

  const publicText = buildPublicDispatchMessage(job);
  const privateText = buildPrivateDriverMessage(job);

  assert.equal(publicText.includes('delville'), false);
  assert.equal(publicText.includes('cathies'), false);
  assert.equal(publicText.includes('Mooroolbark'), true);
  assert.equal(publicText.includes('Wantirna South'), true);
  assert.equal(privateText.includes('23 delville st mooroolbark'), true);
  assert.equal(privateText.includes(job.originalDescription), true);
});

test('public and driver dispatch text hide customer phones and show normalized fare details', () => {
  const customerPhone = '0412 345 678';
  const job = {
    pickupAt: new Date('2026-08-23T07:00:00.000Z'),
    pickup: '1 Main St Croydon',
    pickupSuburb: 'Croydon',
    dropoff: 'Melbourne Airport',
    dropoffSuburb: 'Melbourne Airport',
    passengerCount: 2,
    vehicleRequirement: 'ANY_SUITABLE',
    fareType: 'MINIMUM',
    fareAmount: 75,
    paymentMethod: 'CABCHARGE',
    boa: true,
    customerPhone,
    specialNotes: [`Call ${customerPhone}`, 'steep driveway'],
    originalDescription: `Customer ${customerPhone}\nsteep driveway`,
  };

  const publicText = buildPublicDispatchMessage(job);
  const driverText = buildPrivateDriverMessage(job);
  for (const text of [publicText, driverText]) {
    assert.equal(text.includes(customerPhone), false);
    assert.equal(text.includes('0412345678'), false);
  }
  assert.match(publicText, /Min \$75/);
  assert.match(publicText, /BOA/);
  assert.match(publicText, /2 pax/);
  assert.match(publicText, /Cabcharge/);
  assert.doesNotMatch(publicText, /BOA \$/);
});
