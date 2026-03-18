const BOT_PATTERN = /(bot|spider|crawl|headless|phantom|selenium|puppeteer|python|curl|wget|axios|insomnia|postman)/i;

const NEGATIVE_EVENT_SCORES = {
  pickup_entered: -10,
  dropoff_entered: -10,
  fare_calculated: -15,
  vehicle_selected: -10,
  booking_submit_attempt: -10,
  booking_submit_success: -40,
};

const bandForScore = (score) => {
  if (score <= 0) return 'good';
  if (score < 25) return 'watch';
  if (score < 50) return 'suspicious';
  return 'block_candidate';
};

const computeSessionRisk = ({ session, events, relatedSessions = [] }) => {
  const reasons = new Set();
  let score = 0;

  const eventNames = events.map((event) => event.eventName);
  const hasFunnelDepth = eventNames.some((name) =>
    ['pickup_entered', 'dropoff_entered', 'fare_calculated', 'vehicle_selected', 'booking_submit_attempt', 'booking_submit_success'].includes(name)
  );
  const clickOnlyCount = eventNames.filter((name) => name === 'tel_click' || name === 'whatsapp_click').length;
  const pageViewsOnly =
    eventNames.length > 0 && eventNames.every((name) => ['session_started', 'page_view', 'engaged_view', 'session_ended'].includes(name));

  const repeatedPaidSessions = relatedSessions.filter((item) => item.sourceType === 'google_paid');
  const sameLandingBurstCount = relatedSessions.filter(
    (item) => item.sourceType === 'google_paid' && item.landingPath && item.landingPath === session.landingPath
  ).length;

  if (session.sourceType === 'google_paid' && repeatedPaidSessions.length >= 3) {
    score += 30;
    reasons.add('repeat_paid_ip');
  }

  if ((session.sessionDurationSec || 0) < 5 && pageViewsOnly) {
    score += 15;
    reasons.add('very_short_session');
  }

  if (!hasFunnelDepth) {
    score += 15;
    reasons.add('no_funnel_depth');
  }

  if (clickOnlyCount >= 2 && !hasFunnelDepth) {
    score += 12;
    reasons.add('click_only_pattern');
  }

  if (sameLandingBurstCount >= 4) {
    score += 10;
    reasons.add('burst_paid_landing');
  }

  if (BOT_PATTERN.test(session.userAgent || '')) {
    score += 20;
    reasons.add('suspicious_user_agent');
  }

  for (const event of events) {
    score += NEGATIVE_EVENT_SCORES[event.eventName] || 0;
  }

  return {
    riskScore: score,
    riskBand: bandForScore(score),
    riskReasons: Array.from(reasons),
  };
};

module.exports = {
  computeSessionRisk,
};
