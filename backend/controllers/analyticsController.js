const prisma = require('../lib/prisma');
const { ALLOWED_EVENT_NAMES, MAX_EVENT_BATCH_SIZE, MAX_METADATA_KEYS, MAX_STRING_LENGTH, MAX_TEXT_LENGTH } = require('../lib/analytics/constants');
const { extractAttribution } = require('../lib/analytics/attribution');
const { extractRequestContext } = require('../lib/analytics/requestMeta');
const { computeSessionRisk } = require('../lib/analytics/risk');
const { getMelbourneClassification, isAirportText, normalizeSuburb } = require('../lib/analytics/suburbs');

const safeString = (value, max = MAX_STRING_LENGTH) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const safeToken = (value) => safeString(value, 120);

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sanitizeMetadata = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const entries = Object.entries(input).slice(0, MAX_METADATA_KEYS);
  const sanitized = {};

  for (const [key, value] of entries) {
    if (value == null) continue;

    const cleanKey = safeString(key, 80);
    if (!cleanKey) continue;

    if (typeof value === 'string') {
      sanitized[cleanKey] = value.slice(0, MAX_TEXT_LENGTH);
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[cleanKey] = value;
      continue;
    }

    if (Array.isArray(value)) {
      sanitized[cleanKey] = value
        .slice(0, 10)
        .map((item) => (typeof item === 'string' ? item.slice(0, 120) : item))
        .filter((item) => ['string', 'number', 'boolean'].includes(typeof item));
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

const buildEventCreateInput = (session, rawEvent) => {
  const eventName = safeString(rawEvent?.eventName, 80);
  if (!eventName || !ALLOWED_EVENT_NAMES.includes(eventName)) {
    return null;
  }

  const metadataJson = sanitizeMetadata(rawEvent.metadata || rawEvent.metadataJson);
  const pickupSuburb = normalizeSuburb(rawEvent.pickupSuburb || metadataJson?.pickupAddress);
  const dropoffSuburb = normalizeSuburb(rawEvent.dropoffSuburb || metadataJson?.dropoffAddress);
  const isAirportPickup =
    typeof rawEvent.isAirportPickup === 'boolean'
      ? rawEvent.isAirportPickup
      : isAirportText(rawEvent.pickupSuburb || metadataJson?.pickupAddress || '');
  const isAirportDropoff =
    typeof rawEvent.isAirportDropoff === 'boolean'
      ? rawEvent.isAirportDropoff
      : isAirportText(rawEvent.dropoffSuburb || metadataJson?.dropoffAddress || '');

  return {
    sessionId: session.id,
    visitorId: session.visitorId,
    eventName,
    eventTime: safeDate(rawEvent.eventTime) || new Date(),
    path: safeString(rawEvent.path, 255),
    pageTitle: safeString(rawEvent.pageTitle, 255),
    stepName: safeString(rawEvent.stepName, 100),
    pickupSuburb,
    dropoffSuburb,
    isAirportPickup,
    isAirportDropoff,
    estimatedFare: safeNumber(rawEvent.estimatedFare),
    vehicleType: safeString(rawEvent.vehicleType, 120),
    passengerCount: safeInteger(rawEvent.passengerCount),
    bookingType: safeString(rawEvent.bookingType, 50),
    bookingDateTime: safeDate(rawEvent.bookingDateTime),
    clickTarget: safeString(rawEvent.clickTarget, 255),
    clickLocation: safeString(rawEvent.clickLocation, 120),
    metadataJson,
    sourceTypeSnapshot: session.sourceType,
  };
};

const refreshSessionState = async (sessionId, sessionEndedAt) => {
  const session = await prisma.visitSession.findUnique({
    where: { id: sessionId },
    include: { visitor: true },
  });

  if (!session) {
    return null;
  }

  const events = await prisma.visitEvent.findMany({
    where: { sessionId },
    orderBy: { eventTime: 'asc' },
  });

  const lastEventTime = events.length > 0 ? events[events.length - 1].eventTime : session.startedAt;
  const endedAt = sessionEndedAt || session.endedAt || (events.some((event) => event.eventName === 'session_ended') ? lastEventTime : null);
  const sessionDurationSec = Math.max(
    0,
    Math.round(((endedAt || lastEventTime || new Date()).getTime() - session.startedAt.getTime()) / 1000)
  );

  const repeatedSessions = session.ipHash
    ? await prisma.visitSession.findMany({
        where: {
          ipHash: session.ipHash,
          startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          sourceType: true,
          landingPath: true,
          sessionDurationSec: true,
          riskBand: true,
          riskReasonDetailsJson: true,
        },
      })
    : [];

  const relatedSessions = repeatedSessions.map((item) => ({
    ...item,
    hasFunnelDepth: Array.isArray(item.riskReasonDetailsJson)
      ? item.riskReasonDetailsJson.some((reason) => reason?.code === 'current_session_engaged')
      : false,
  }));

  const risk = computeSessionRisk({
    session: { ...session, sessionDurationSec },
    events,
    relatedSessions,
  });

  const melbourneClassification = getMelbourneClassification({
    geoCity: session.geoCity,
    geoRegion: session.geoRegion,
    geoCountry: session.geoCountry,
    timezone: session.timezone,
    landingPath: session.landingPath,
    pickupSuburb: events.map((event) => event.pickupSuburb).find(Boolean),
    dropoffSuburb: events.map((event) => event.dropoffSuburb).find(Boolean),
    isAirportPickup: events.some((event) => event.isAirportPickup),
    isAirportDropoff: events.some((event) => event.isAirportDropoff),
  });

  const updatedSession = await prisma.visitSession.update({
    where: { id: sessionId },
    data: {
      endedAt,
      sessionDurationSec,
      eventCount: events.length,
      isLikelyMelbourne: melbourneClassification.isLikelyMelbourne,
      melbourneClassificationReason: melbourneClassification.reasons,
      riskScore: risk.riskScore,
      riskBand: risk.riskBand,
      riskReasonsJson: risk.riskReasons,
      riskReasonDetailsJson: risk.riskReasonDetails,
    },
  });

  const successfulBookingEvent = events.find((event) => event.eventName === 'booking_submit_success');
  const rideId = safeInteger(successfulBookingEvent?.metadataJson?.rideId);

  if (rideId && !updatedSession.attributedRideId) {
    await prisma.visitSession.update({
      where: { id: sessionId },
      data: { attributedRideId: rideId },
    });
  }

  if (updatedSession.ipHash && ['suspicious', 'block_candidate'].includes(updatedSession.riskBand) && risk.riskReasons.length > 0) {
    const [sessionCount, paidSessionCount, suspiciousSessionCount] = await Promise.all([
      prisma.visitSession.count({ where: { ipHash: updatedSession.ipHash } }),
      prisma.visitSession.count({ where: { ipHash: updatedSession.ipHash, sourceType: 'google_paid' } }),
      prisma.visitSession.count({
        where: {
          ipHash: updatedSession.ipHash,
          riskBand: { in: ['suspicious', 'block_candidate'] },
        },
      }),
    ]);

    await prisma.trafficBlockSignal.upsert({
      where: {
        ipHash_reason: {
          ipHash: updatedSession.ipHash,
          reason: risk.riskReasons[0],
        },
      },
      update: {
        lastSeenAt: new Date(),
        sessionCount,
        paidSessionCount,
        suspiciousSessionCount,
      },
      create: {
        ipHash: updatedSession.ipHash,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        sessionCount,
        paidSessionCount,
        suspiciousSessionCount,
        reason: risk.riskReasons[0],
      },
    });
  }

  return updatedSession;
};

const startSession = async (req, res) => {
  try {
    const visitorToken = safeToken(req.body?.visitorToken);
    const sessionToken = safeToken(req.body?.sessionToken);

    if (!visitorToken || !sessionToken) {
      return res.status(400).json({ error: 'visitorToken and sessionToken are required.' });
    }

    const existingSession = await prisma.visitSession.findUnique({ where: { sessionToken } });
    if (existingSession) {
      const updated = await refreshSessionState(existingSession.id, existingSession.endedAt);
      return res.json({
        ok: true,
        sessionToken,
        sourceType: updated?.sourceType || existingSession.sourceType,
        riskBand: updated?.riskBand || existingSession.riskBand,
        resumed: true,
      });
    }

    const attribution = extractAttribution(req.body || {});
    const context = extractRequestContext(req, req.body || {});

    const visitor = await prisma.visitor.upsert({
      where: { visitorToken },
      update: {
        lastSeenAt: new Date(),
      },
      create: {
        visitorToken,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        firstSourceType: attribution.sourceType,
        firstLandingPath: attribution.landingPath,
      },
    });

    const session = await prisma.visitSession.create({
      data: {
        sessionToken,
        visitorId: visitor.id,
        landingUrl: attribution.landingUrl,
        landingPath: attribution.landingPath,
        referrer: attribution.referrer,
        sourceType: attribution.sourceType,
        utmSource: attribution.utmSource,
        utmMedium: attribution.utmMedium,
        utmCampaign: attribution.utmCampaign,
        utmTerm: attribution.utmTerm,
        utmContent: attribution.utmContent,
        gclid: attribution.gclid,
        gbraid: attribution.gbraid,
        wbraid: attribution.wbraid,
        sourceClassificationReason: attribution.sourceClassificationReason,
        geoCity: context.geoCity,
        geoRegion: context.geoRegion,
        geoCountry: context.geoCountry,
        isLikelyMelbourne: getMelbourneClassification({
          geoCity: context.geoCity,
          geoRegion: context.geoRegion,
          geoCountry: context.geoCountry,
          timezone: context.timezone,
          landingPath: attribution.landingPath,
        }).isLikelyMelbourne,
        melbourneClassificationReason: getMelbourneClassification({
          geoCity: context.geoCity,
          geoRegion: context.geoRegion,
          geoCountry: context.geoCountry,
          timezone: context.timezone,
          landingPath: attribution.landingPath,
        }).reasons,
        ipHash: context.ipHash,
        userAgent: context.userAgent,
        browser: context.browser,
        deviceType: context.deviceType,
        screenWidth: context.screenWidth,
        timezone: context.timezone,
      },
    });

    await prisma.visitEvent.create({
      data: {
        sessionId: session.id,
        visitorId: visitor.id,
        eventName: 'session_started',
        eventTime: new Date(),
        path: attribution.landingPath,
        pageTitle: safeString(req.body?.pageTitle, 255),
        sourceTypeSnapshot: attribution.sourceType,
        metadataJson: sanitizeMetadata({
          landingUrl: attribution.landingUrl,
          referrer: attribution.referrer,
        }),
      },
    });

    const updated = await refreshSessionState(session.id);

    return res.status(201).json({
      ok: true,
      sessionToken,
      sourceType: updated?.sourceType || attribution.sourceType,
      riskBand: updated?.riskBand || 'good',
      resumed: false,
    });
  } catch (error) {
    console.error('Failed to start analytics session:', error);
    return res.status(500).json({ error: 'Failed to start analytics session.' });
  }
};

const ingestEventsBatch = async (req, res) => {
  try {
    const sessionToken = safeToken(req.body?.sessionToken);
    if (!sessionToken) {
      return res.status(400).json({ error: 'sessionToken is required.' });
    }

    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    if (events.length === 0) {
      return res.status(400).json({ error: 'events array is required.' });
    }

    if (events.length > MAX_EVENT_BATCH_SIZE) {
      return res.status(413).json({ error: `Batch size exceeds ${MAX_EVENT_BATCH_SIZE} events.` });
    }

    const session = await prisma.visitSession.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return res.status(404).json({ error: 'Analytics session not found.' });
    }

    const createInputs = events.map((event) => buildEventCreateInput(session, event)).filter(Boolean);
    if (createInputs.length === 0) {
      return res.status(400).json({ error: 'No valid analytics events in batch.' });
    }

    await prisma.$transaction(createInputs.map((data) => prisma.visitEvent.create({ data })));

    const endedAt = createInputs.some((event) => event.eventName === 'session_ended')
      ? createInputs[createInputs.length - 1].eventTime
      : null;
    const updatedSession = await refreshSessionState(session.id, endedAt);

    return res.status(201).json({
      ok: true,
      accepted: createInputs.length,
      riskScore: updatedSession?.riskScore ?? session.riskScore,
      riskBand: updatedSession?.riskBand ?? session.riskBand,
    });
  } catch (error) {
    console.error('Failed to ingest analytics events:', error);
    return res.status(500).json({ error: 'Failed to ingest analytics events.' });
  }
};

const endSession = async (req, res) => {
  try {
    const sessionToken = safeToken(req.body?.sessionToken);
    if (!sessionToken) {
      return res.status(400).json({ error: 'sessionToken is required.' });
    }

    const session = await prisma.visitSession.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return res.status(404).json({ error: 'Analytics session not found.' });
    }

    const endedAt = safeDate(req.body?.endedAt) || new Date();

    await prisma.visitEvent.create({
      data: {
        sessionId: session.id,
        visitorId: session.visitorId,
        eventName: 'session_ended',
        eventTime: endedAt,
        path: safeString(req.body?.path, 255) || session.landingPath,
        pageTitle: safeString(req.body?.pageTitle, 255),
        sourceTypeSnapshot: session.sourceType,
        metadataJson: sanitizeMetadata({
          reason: req.body?.reason || 'browser_unload',
        }),
      },
    });

    const updatedSession = await refreshSessionState(session.id, endedAt);

    return res.json({
      ok: true,
      sessionToken,
      riskBand: updatedSession?.riskBand ?? session.riskBand,
      durationSec: updatedSession?.sessionDurationSec ?? session.sessionDurationSec,
    });
  } catch (error) {
    console.error('Failed to end analytics session:', error);
    return res.status(500).json({ error: 'Failed to end analytics session.' });
  }
};

const getAnalyticsDebugSessions = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const sessions = await prisma.visitSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        sessionToken: true,
        visitorId: true,
        sourceType: true,
        sourceClassificationReason: true,
        gclid: true,
        gbraid: true,
        wbraid: true,
        referrer: true,
        landingPath: true,
        isLikelyMelbourne: true,
        melbourneClassificationReason: true,
        riskScore: true,
        riskBand: true,
        riskReasonsJson: true,
        riskReasonDetailsJson: true,
        startedAt: true,
        endedAt: true,
      },
    });

    return res.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch analytics debug sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics debug sessions.' });
  }
};

module.exports = {
  startSession,
  ingestEventsBatch,
  endSession,
  getAnalyticsDebugSessions,
};
