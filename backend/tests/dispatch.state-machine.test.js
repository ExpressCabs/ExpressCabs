const test = require('node:test');
const assert = require('node:assert/strict');
const { assertValidTransition, transitionDispatchJob } = require('../lib/dispatch/stateMachine');

test('dispatch state machine accepts valid transitions and rejects invalid transitions', () => {
  assert.doesNotThrow(() => assertValidTransition('READY_FOR_DISPATCH', 'MAIN_DISPATCHED'));
  assert.throws(
    () => assertValidTransition('READY_FOR_DISPATCH', 'COMPLETED'),
    /Invalid dispatch transition/
  );
});

test('transitionDispatchJob updates status and creates audit records', async () => {
  const calls = [];
  const fakePrisma = {
    dispatchJob: {
      findUnique: async () => ({ id: 9, status: 'READY_FOR_DISPATCH', dispatchedMainAt: null }),
      update: async ({ data }) => {
        calls.push({ type: 'update', data });
        return { id: 9, status: data.status };
      },
    },
    dispatchAudit: {
      create: async ({ data }) => {
        calls.push({ type: 'audit', data });
        return data;
      },
    },
    $transaction: async (operations) => Promise.all(operations),
  };

  const updated = await transitionDispatchJob(fakePrisma, 9, 'MAIN_DISPATCHED', {
    actor: 'OWNER',
    details: { source: 'test' },
  });

  assert.equal(updated.status, 'MAIN_DISPATCHED');
  assert.equal(calls[0].data.status, 'MAIN_DISPATCHED');
  assert.equal(Boolean(calls[0].data.dispatchedMainAt), true);
  assert.equal(calls[1].data.fromStatus, 'READY_FOR_DISPATCH');
  assert.equal(calls[1].data.toStatus, 'MAIN_DISPATCHED');
});
