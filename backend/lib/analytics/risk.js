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

const FUNNEL_EVENTS = ['pickup_entered', 'dropoff_entered', 'fare_calculated', 'vehicle_selected', 'booking_submit_attempt', 'booking_submit_success'];

const computeSessionRisk = ({ session, events, relatedSessions = [] }) => {
  const reasons = [];
  let score = 0;

  const eventNames = events.map((event) => event.eventName);
  const hasFunnelDepth = eventNames.some((name) => FUNNEL_EVENTS.includes(name));
  const clickOnlyCount = eventNames.filter((name) => name === 'tel_click' || name === 'whatsapp_click').length;
  const pageViewsOnly =
    eventNames.length > 0 && eventNames.every((name) => ['session_started', 'page_view', 'engaged_view', 'session_ended'].includes(name));

  const repeatedPaidSessions = relatedSessions.filter((item) => item.sourceType === 'google_paid');
  const repeatedShortNoDepthSessions = relatedSessions.filter((item) => (item.sessionDurationSec || 0) < 10 && !item.hasFunnelDepth);
  const sameLandingBurstCount = relatedSessions.filter((item) => item.landingPath && item.landingPath === session.landingPath && (item.sessionDurationSec || 0) < 10).length;
  const repeatedEngagedSessions = relatedSessions.filter((item) => item.hasFunnelDepth);
  const addReason = (code, points, details = {}) => {
    score += points;
    reasons.push({ code, points, ...details });
  };

  if (session.sourceType === 'google_paid' && repeatedPaidSessions.length >= 3) {
    addReason('repeat_paid_ip', 25, { repeatPaidSessions: repeatedPaidSessions.length });
  }

  if ((session.sessionDurationSec || 0) < 5 && pageViewsOnly) {
    addReason('very_short_session', 15, { sessionDurationSec: session.sessionDurationSec || 0 });
  }

  if (!hasFunnelDepth) {
    addReason('no_funnel_depth', 15);
  }

  if (clickOnlyCount >= 2 && !hasFunnelDepth) {
    addReason('click_only_pattern', 12, { clickOnlyCount });
  }

  if (repeatedShortNoDepthSessions.length >= 2) {
    addReason('repeat_short_no_depth_ip', 18, { repeatedShortNoDepthSessions: repeatedShortNoDepthSessions.length });
  }

  if (sameLandingBurstCount >= 3) {
    addReason('repeat_same_landing_quick_exit', 12, { sameLandingBurstCount });
  }

  if (BOT_PATTERN.test(session.userAgent || '')) {
    addReason('suspicious_user_agent', 24, { userAgent: session.userAgent || '' });
  }

  for (const event of events) {
    score += NEGATIVE_EVENT_SCORES[event.eventName] || 0;
  }

  if (repeatedEngagedSessions.length >= 1) {
    addReason('repeat_engaged_return', -12, { repeatedEngagedSessions: repeatedEngagedSessions.length });
  }

  if (hasFunnelDepth) {
    addReason('current_session_engaged', -8, { funnelEvents: eventNames.filter((name) => FUNNEL_EVENTS.includes(name)) });
  }

  const riskReasons = reasons.filter((reason) => reason.points > 0).map((reason) => reason.code);

  return {
    riskScore: score,
    riskBand: bandForScore(score),
    riskReasons,
    riskReasonDetails: reasons,
  };
};

module.exports = {
  computeSessionRisk,
};
