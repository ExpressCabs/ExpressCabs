const test = require('node:test');
const assert = require('node:assert/strict');

const { extractAttribution, resolveSourceType } = require('../lib/analytics/attribution');

test('resolveSourceType prefers google_paid when gclid exists', () => {
  const result = extractAttribution({
    gclid: 'test123',
    referrer: 'https://www.google.com/search?q=prime+cabs',
  });

  assert.equal(result.sourceType, 'google_paid');
  assert.equal(result.gclid, 'test123');
  assert.equal(result.sourceClassificationReason, 'gclid');
});

test('resolveSourceType uses google_organic for google referrer without paid ids', () => {
  assert.equal(
    resolveSourceType({
      referrer: 'https://www.google.com/search?q=prime+cabs',
    }),
    'google_organic'
  );
});

test('resolveSourceType uses direct for empty referrer', () => {
  assert.equal(
    resolveSourceType({
      referrer: '',
    }),
    'direct'
  );
});

test('resolveSourceType uses referral_or_other for non-google referrer', () => {
  assert.equal(
    resolveSourceType({
      referrer: 'https://example.com/some-page',
    }),
    'referral_or_other'
  );
});
