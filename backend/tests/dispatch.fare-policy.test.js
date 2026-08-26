const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseFareInstruction,
  parsePaymentMethod,
  toDispatchMinimumTier,
} = require('../lib/dispatch/farePolicy');

test('fare instructions and payment methods remain separate', () => {
  assert.deepEqual(parseFareInstruction('Min $75 cabcharge'), { fareType: 'MINIMUM', fareAmount: 75 });
  assert.deepEqual(parseFareInstruction('Collect $40 cash'), { fareType: 'COLLECT', fareAmount: 40 });
  assert.equal(parsePaymentMethod('MPTP/Card'), 'MPTP_CARD');
  assert.equal(parsePaymentMethod('MPTP Cabcharge'), 'MPTP_CABCHARGE');
  assert.equal(parsePaymentMethod('cash or card'), 'CASH_OR_CARD');
});

test('calculated fares map to backend-owned dispatch tiers and BOA', () => {
  assert.deepEqual(toDispatchMinimumTier(65), { fareType: 'MINIMUM', fareAmount: 50, boa: false });
  assert.deepEqual(toDispatchMinimumTier(70), { fareType: 'MINIMUM', fareAmount: 75, boa: true });
  assert.deepEqual(toDispatchMinimumTier(94), { fareType: 'MINIMUM', fareAmount: 100, boa: true });
  assert.deepEqual(toDispatchMinimumTier(120), { fareType: 'MINIMUM', fareAmount: 125, boa: true });
});
