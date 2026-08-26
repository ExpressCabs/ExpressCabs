const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFare } = require('../services/dispatch/dispatchFareEstimator');

test('backend dispatch fare calculator produces a finite positive fare', () => {
  const fare = calculateFare({
    distanceKm: 30,
    durationMin: 40,
    pickupAt: '2026-08-27T10:00:00+10:00',
    passengerCount: 2,
    pickup: 'Croydon VIC',
    hasTolls: false,
  });
  assert.equal(Number.isFinite(fare), true);
  assert.equal(fare > 0, true);
});
