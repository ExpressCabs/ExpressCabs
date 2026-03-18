const test = require('node:test');
const assert = require('node:assert/strict');

const { getMelbourneClassification } = require('../lib/analytics/suburbs');
const { computeSessionRisk } = require('../lib/analytics/risk');

test('Melbourne classification turns true for local timezone and airport-intent landing page', () => {
  const result = getMelbourneClassification({
    timezone: 'Australia/Sydney',
    landingPath: '/airport-taxi-melbourne',
    geoCountry: 'au',
  });

  assert.equal(result.isLikelyMelbourne, true);
  assert.equal(result.reasons.melbourneByTimezone, true);
  assert.equal(result.reasons.melbourneByLandingPage, true);
});

test('repeated short low-depth sessions score higher while engaged repeats soften risk', () => {
  const risk = computeSessionRisk({
    session: {
      sourceType: 'google_paid',
      sessionDurationSec: 3,
      landingPath: '/airport-taxi-melbourne',
      userAgent: 'Mozilla/5.0',
    },
    events: [
      { eventName: 'session_started' },
      { eventName: 'page_view' },
    ],
    relatedSessions: [
      {
        sourceType: 'google_paid',
        landingPath: '/airport-taxi-melbourne',
        sessionDurationSec: 4,
        hasFunnelDepth: false,
      },
      {
        sourceType: 'google_paid',
        landingPath: '/airport-taxi-melbourne',
        sessionDurationSec: 5,
        hasFunnelDepth: false,
      },
      {
        sourceType: 'google_paid',
        landingPath: '/airport-taxi-melbourne',
        sessionDurationSec: 120,
        hasFunnelDepth: true,
      },
    ],
  });

  assert.equal(risk.riskBand, 'suspicious');
  assert.ok(risk.riskReasons.includes('repeat_short_no_depth_ip'));
  assert.ok(risk.riskReasonDetails.some((reason) => reason.code === 'repeat_engaged_return' && reason.points < 0));
});
