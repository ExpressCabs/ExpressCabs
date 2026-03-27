const prisma = require('../lib/prisma');
const {
  getNonAdminEventWhere,
  getNonAdminNestedEventWhere,
  getNonAdminSessionWhere,
  isAdminSessionRecord,
} = require('../lib/analytics/adminExclusion');

const VALID_RANGES = new Set(['today', '24h', '7d', '30d']);
const VALID_SOURCE_TYPES = new Set(['google_paid', 'google_organic', 'direct', 'referral_or_other']);
const VALID_RISK_BANDS = new Set(['good', 'watch', 'suspicious', 'block_candidate']);
const LIVE_SESSION_WINDOW_MS = 15 * 1000;
const FUNNEL_STEPS = [
  'session_started',
  'page_view',
  'engaged_view',
  'booking_started',
  'pickup_entered',
  'dropoff_entered',
  'fare_calculated',
  'vehicle_selected',
  'booking_submit_attempt',
  'booking_submit_success',
];

const safeInt = (value, fallback, { min = 1, max = 100 } = {}) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const getRangeStart = (range) => {
  const now = new Date();
  if (!VALID_RANGES.has(range)) {
    range = 'today';
  }

  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const map = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  };

  return new Date(now.getTime() - map[range] * 60 * 60 * 1000);
};

const parseBool = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const getSessionTiming = (session) => {
  const now = Date.now();
  const startedAt = session.startedAt ? new Date(session.startedAt) : null;
  const updatedAt = session.updatedAt ? new Date(session.updatedAt) : null;
  const explicitEndedAt = session.endedAt ? new Date(session.endedAt) : null;
  const inferredEndedAt =
    !explicitEndedAt && updatedAt && updatedAt.getTime() < now - LIVE_SESSION_WINDOW_MS
      ? updatedAt
      : null;
  const effectiveEndedAt = explicitEndedAt || inferredEndedAt;
  const effectiveDurationSec =
    startedAt && (effectiveEndedAt || updatedAt)
      ? Math.max(0, Math.round(((effectiveEndedAt || updatedAt).getTime() - startedAt.getTime()) / 1000))
      : session.sessionDurationSec || 0;

  return {
    reportedEndedAt: effectiveEndedAt,
    reportedDurationSec: effectiveDurationSec,
    reportedEndReason: explicitEndedAt ? 'session_ended' : inferredEndedAt ? 'heartbeat_timeout' : 'active',
  };
};

const buildSessionWhere = (query = {}, { activeOnly = false } = {}) => {
  const where = getNonAdminSessionWhere({});
  if (activeOnly) {
    where.endedAt = null;
    where.updatedAt = { gte: new Date(Date.now() - LIVE_SESSION_WINDOW_MS) };
  } else if (query.range) {
    where.startedAt = { gte: getRangeStart(query.range) };
  }

  if (VALID_SOURCE_TYPES.has(query.sourceType)) {
    where.sourceType = query.sourceType;
  }

  if (VALID_RISK_BANDS.has(query.riskBand)) {
    where.riskBand = query.riskBand;
  }

  const melbourneOnly = parseBool(query.isLikelyMelbourne);
  if (melbourneOnly !== null) {
    where.isLikelyMelbourne = melbourneOnly;
  }

  if (parseBool(query.paidOnly) === true) {
    where.sourceType = 'google_paid';
  }

  if (parseBool(query.gclidPresent) === true) {
    where.gclid = { not: null };
  }

  return where;
};

const summarizeSession = (session) => {
  const latestEvent = session.events?.[0] || null;
  const eventWithRoute = session.events?.find((event) => event.pickupSuburb || event.dropoffSuburb) || null;
  const timing = getSessionTiming(session);

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    endedAt: timing.reportedEndedAt,
    durationSec: timing.reportedDurationSec,
    endReason: timing.reportedEndReason,
    sourceType: session.sourceType,
    sourceClassificationReason: session.sourceClassificationReason,
    riskBand: session.riskBand,
    riskScore: session.riskScore,
    eventCount: session.eventCount,
    deviceType: session.deviceType,
    browser: session.browser,
    landingPath: session.landingPath,
    pickupSuburb: eventWithRoute?.pickupSuburb || null,
    dropoffSuburb: eventWithRoute?.dropoffSuburb || null,
    isLikelyMelbourne: session.isLikelyMelbourne,
    hasGclid: Boolean(session.gclid || session.gbraid || session.wbraid),
    latestEventName: latestEvent?.eventName || null,
  };
};

const getNonAdminIpHashWhere = (extraWhere = {}) =>
  getNonAdminSessionWhere({
    ...extraWhere,
    ipHash: { not: null },
  });

const getKnownNonAdminIpHashes = async (extraWhere = {}) => {
  const rows = await prisma.visitSession.findMany({
    where: getNonAdminIpHashWhere(extraWhere),
    distinct: ['ipHash'],
    select: { ipHash: true },
  });

  return rows.map((row) => row.ipHash).filter(Boolean);
};

const getOverview = async (req, res) => {
  try {
    const range = VALID_RANGES.has(req.query.range) ? req.query.range : 'today';
    const since = getRangeStart(range);
    const sessionWhere = getNonAdminSessionWhere({ startedAt: { gte: since } });
    const eventWhere = getNonAdminEventWhere({ eventTime: { gte: since } });

    const [sessions, events] = await Promise.all([
      prisma.visitSession.findMany({
        where: sessionWhere,
        orderBy: { startedAt: 'desc' },
        take: 10,
        include: {
          events: {
            where: getNonAdminNestedEventWhere(),
            orderBy: { eventTime: 'desc' },
            take: 3,
          },
        },
      }),
      prisma.visitEvent.findMany({
        where: {
          ...eventWhere,
          eventName: {
            in: ['booking_started', 'fare_calculated', 'booking_submit_success', 'tel_click', 'whatsapp_click'],
          },
        },
        select: {
          eventName: true,
          sessionId: true,
        },
      }),
    ]);

    const allSessions = await prisma.visitSession.findMany({
      where: sessionWhere,
      select: { sourceType: true, riskBand: true },
    });

    const countDistinctSessionsForEvent = (eventName) =>
      new Set(events.filter((event) => event.eventName === eventName).map((event) => event.sessionId)).size;

    const sourceBreakdown = Array.from(
      allSessions.reduce((map, session) => {
        map.set(session.sourceType, (map.get(session.sourceType) || 0) + 1);
        return map;
      }, new Map())
    ).map(([sourceType, count]) => ({ sourceType, count }));

    const riskBandBreakdown = Array.from(
      allSessions.reduce((map, session) => {
        map.set(session.riskBand, (map.get(session.riskBand) || 0) + 1);
        return map;
      }, new Map())
    ).map(([riskBand, count]) => ({ riskBand, count }));

    return res.json({
      range,
      activeSessions: await prisma.visitSession.count({
        where: getNonAdminSessionWhere({
          endedAt: null,
          updatedAt: { gte: new Date(Date.now() - LIVE_SESSION_WINDOW_MS) },
        }),
      }),
      sessionsToday: allSessions.length,
      googlePaid: allSessions.filter((session) => session.sourceType === 'google_paid').length,
      googleOrganic: allSessions.filter((session) => session.sourceType === 'google_organic').length,
      direct: allSessions.filter((session) => session.sourceType === 'direct').length,
      referralOrOther: allSessions.filter((session) => session.sourceType === 'referral_or_other').length,
      bookingStarted: countDistinctSessionsForEvent('booking_started'),
      fareCalculated: countDistinctSessionsForEvent('fare_calculated'),
      bookingSuccess: countDistinctSessionsForEvent('booking_submit_success'),
      telClicks: events.filter((event) => event.eventName === 'tel_click').length,
      whatsappClicks: events.filter((event) => event.eventName === 'whatsapp_click').length,
      suspiciousSessions: allSessions.filter((session) => session.riskBand === 'suspicious').length,
      blockCandidateSessions: allSessions.filter((session) => session.riskBand === 'block_candidate').length,
      sourceBreakdown,
      riskBandBreakdown,
      recentSessions: sessions.map(summarizeSession),
    });
  } catch (error) {
    console.error('Failed to fetch admin analytics overview:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics overview.' });
  }
};

const getLiveSessions = async (req, res) => {
  try {
    const limit = safeInt(req.query.limit, 25, { min: 1, max: 100 });
    const sessions = await prisma.visitSession.findMany({
      where: buildSessionWhere(req.query, { activeOnly: true }),
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        events: {
          where: getNonAdminNestedEventWhere(),
          orderBy: { eventTime: 'desc' },
          take: 5,
        },
      },
    });

    return res.json({ sessions: sessions.map(summarizeSession) });
  } catch (error) {
    console.error('Failed to fetch live sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch live sessions.' });
  }
};

const getFunnel = async (req, res) => {
  try {
    const since = getRangeStart(req.query.range || 'today');
    const events = await prisma.visitEvent.findMany({
      where: {
        ...getNonAdminEventWhere({
          eventTime: { gte: since },
          eventName: { in: FUNNEL_STEPS },
        }),
      },
      select: {
        sessionId: true,
        eventName: true,
        sourceTypeSnapshot: true,
      },
    });

    const sources = ['all', 'google_paid', 'google_organic', 'direct', 'referral_or_other'];
    const funnel = sources.map((source) => {
      const sourceEvents = source === 'all' ? events : events.filter((event) => event.sourceTypeSnapshot === source);
      return {
        sourceType: source,
        stages: FUNNEL_STEPS.map((step, index) => {
          const count = new Set(sourceEvents.filter((event) => event.eventName === step).map((event) => event.sessionId)).size;
          const previousStep = index > 0 ? FUNNEL_STEPS[index - 1] : null;
          const previousCount = previousStep
            ? new Set(sourceEvents.filter((event) => event.eventName === previousStep).map((event) => event.sessionId)).size
            : count;

          return {
            eventName: step,
            sessionCount: count,
            dropOffPct: previousCount > 0 ? Number((((previousCount - count) / previousCount) * 100).toFixed(1)) : 0,
            conversionPct: previousCount > 0 ? Number(((count / previousCount) * 100).toFixed(1)) : 100,
          };
        }),
      };
    });

    return res.json({ funnel });
  } catch (error) {
    console.error('Failed to fetch funnel analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch funnel analytics.' });
  }
};

const getSourceBreakdown = async (req, res) => {
  req.query.range = req.query.range || 'today';
  return getOverview(req, res);
};

const getSuburbInsights = async (req, res) => {
  try {
    const since = getRangeStart(req.query.range || 'today');
    const airportOnly = parseBool(req.query.airportOnly);
    const events = await prisma.visitEvent.findMany({
      where: {
        ...getNonAdminEventWhere({
          eventTime: { gte: since },
          OR: [
            { pickupSuburb: { not: null } },
            { dropoffSuburb: { not: null } },
          ],
        }),
      },
      select: {
        sessionId: true,
        pickupSuburb: true,
        dropoffSuburb: true,
        isAirportPickup: true,
        isAirportDropoff: true,
        sourceTypeSnapshot: true,
      },
    });

    const filteredEvents = airportOnly === null
      ? events
      : events.filter((event) => airportOnly ? event.isAirportPickup || event.isAirportDropoff : true);

    const tally = (items, key) =>
      Array.from(
        items.reduce((map, item) => {
          const value = item[key];
          if (!value) return map;
          map.set(value, (map.get(value) || 0) + 1);
          return map;
        }, new Map())
      )
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const routePairs = Array.from(
      filteredEvents.reduce((map, event) => {
        if (!event.pickupSuburb || !event.dropoffSuburb) return map;
        const key = `${event.pickupSuburb} -> ${event.dropoffSuburb}`;
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map())
    )
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const paidTrafficBySuburb = tally(filteredEvents.filter((event) => event.sourceTypeSnapshot === 'google_paid'), 'pickupSuburb');
    const suspiciousSessions = await prisma.visitSession.findMany({
      where: {
        ...getNonAdminSessionWhere({
          startedAt: { gte: since },
          riskBand: { in: ['suspicious', 'block_candidate'] },
        }),
      },
      include: {
        events: {
          where: getNonAdminNestedEventWhere({
            OR: [{ pickupSuburb: { not: null } }, { dropoffSuburb: { not: null } }],
          }),
          take: 5,
        },
      },
    });

    const suspiciousTrafficBySuburb = tally(
      suspiciousSessions.flatMap((session) => session.events.map((event) => ({ pickupSuburb: event.pickupSuburb }))),
      'pickupSuburb'
    );

    return res.json({
      topPickupSuburbs: tally(filteredEvents, 'pickupSuburb'),
      topDropoffSuburbs: tally(filteredEvents, 'dropoffSuburb'),
      topRoutePairs: routePairs,
      paidTrafficBySuburb,
      suspiciousTrafficBySuburb,
    });
  } catch (error) {
    console.error('Failed to fetch suburb insights:', error);
    return res.status(500).json({ error: 'Failed to fetch suburb insights.' });
  }
};

const getTrafficQuality = async (req, res) => {
  try {
    const since = getRangeStart(req.query.range || 'today');
    const sessions = await prisma.visitSession.findMany({
      where: {
        ...getNonAdminSessionWhere({
          startedAt: { gte: since },
          ...buildSessionWhere(req.query),
        }),
      },
      orderBy: { startedAt: 'desc' },
      include: {
        events: {
          where: getNonAdminNestedEventWhere(),
          orderBy: { eventTime: 'desc' },
          take: 5,
        },
      },
    });

    const signals = await prisma.trafficBlockSignal.findMany({
      where: {
        ipHash: {
          in: await getKnownNonAdminIpHashes({ startedAt: { gte: since } }),
        },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 100,
    });

    const groupByIp = (predicate) =>
      Array.from(
        sessions.reduce((map, session) => {
          if (!session.ipHash || !predicate(session)) return map;
          const row = map.get(session.ipHash) || {
            ipHash: session.ipHash,
            totalSessions: 0,
            paidSessions: 0,
            suspiciousSessions: 0,
            lastSeen: session.updatedAt,
            primaryReason: Array.isArray(session.riskReasonsJson) ? session.riskReasonsJson[0] : null,
          };
          row.totalSessions += 1;
          if (session.sourceType === 'google_paid') row.paidSessions += 1;
          if (['suspicious', 'block_candidate'].includes(session.riskBand)) row.suspiciousSessions += 1;
          if (session.updatedAt > row.lastSeen) row.lastSeen = session.updatedAt;
          map.set(session.ipHash, row);
          return map;
        }, new Map())
      )
        .map(([, value]) => value)
        .sort((a, b) => b.suspiciousSessions - a.suspiciousSessions);

    return res.json({
      suspiciousSessionsToday: sessions.filter((session) => session.riskBand === 'suspicious').length,
      blockCandidatesToday: sessions.filter((session) => session.riskBand === 'block_candidate').length,
      repeatPaidIpHashes: groupByIp((session) => session.sourceType === 'google_paid' && session.riskBand !== 'good').slice(0, 20),
      repeatedNoDepthIpSummary: groupByIp((session) => Array.isArray(session.riskReasonsJson) && session.riskReasonsJson.includes('no_funnel_depth')).slice(0, 20),
      clickOnlyPatternSummary: groupByIp((session) => Array.isArray(session.riskReasonsJson) && session.riskReasonsJson.includes('click_only_pattern')).slice(0, 20),
      suspiciousSessions: sessions
        .filter((session) => ['suspicious', 'block_candidate'].includes(session.riskBand))
        .slice(0, 50)
        .map(summarizeSession),
      botLikeSessions: sessions.filter((session) => Array.isArray(session.riskReasonsJson) && session.riskReasonsJson.includes('suspicious_user_agent')).length,
      blockSignals: signals,
    });
  } catch (error) {
    console.error('Failed to fetch traffic quality analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch traffic quality analytics.' });
  }
};

const getSessions = async (req, res) => {
  try {
    const page = safeInt(req.query.page, 1, { min: 1, max: 10000 });
    const limit = safeInt(req.query.limit, 25, { min: 1, max: 100 });
    const skip = (page - 1) * limit;
    const where = buildSessionWhere(req.query);

    if (req.query.suburb) {
      where.events = {
        some: {
          OR: [
            { pickupSuburb: req.query.suburb },
            { dropoffSuburb: req.query.suburb },
          ],
        },
      };
    }

    if (req.query.eventName) {
      where.events = {
        ...(where.events || {}),
        some: {
          ...((where.events && where.events.some) || {}),
          eventName: req.query.eventName,
        },
      };
    }

    const [sessions, total] = await Promise.all([
      prisma.visitSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: {
          events: {
            where: getNonAdminNestedEventWhere(),
            orderBy: { eventTime: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.visitSession.count({ where }),
    ]);

    return res.json({
      page,
      limit,
      total,
      sessions: sessions.map(summarizeSession),
    });
  } catch (error) {
    console.error('Failed to fetch analytics sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics sessions.' });
  }
};

const getSessionDetail = async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id.' });
    }

    const session = await prisma.visitSession.findUnique({
      where: { id: sessionId },
      include: {
        visitor: true,
        events: {
          where: getNonAdminNestedEventWhere(),
          orderBy: { eventTime: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (isAdminSessionRecord(session)) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const timing = getSessionTiming(session);

    const relatedBlockSignals = session.ipHash
      ? await prisma.trafficBlockSignal.findMany({
          where: { ipHash: session.ipHash },
          orderBy: { lastSeenAt: 'desc' },
        })
      : [];

    return res.json({
      session: {
        ...session,
        endedAt: timing.reportedEndedAt,
        durationSec: timing.reportedDurationSec,
        endReason: timing.reportedEndReason,
      },
      visitor: session.visitor
        ? {
            id: session.visitor.id,
            visitorToken: session.visitor.visitorToken,
            firstSeenAt: session.visitor.firstSeenAt,
            lastSeenAt: session.visitor.lastSeenAt,
          }
        : null,
      events: session.events,
      relatedBlockSignals,
    });
  } catch (error) {
    console.error('Failed to fetch analytics session detail:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics session detail.' });
  }
};

const getBlockSignals = async (req, res) => {
  try {
    const page = safeInt(req.query.page, 1, { min: 1, max: 10000 });
    const limit = safeInt(req.query.limit, 25, { min: 1, max: 100 });
    const skip = (page - 1) * limit;
    const where = {};

    if (req.query.status) {
      where.status = String(req.query.status);
    }

    const allowedIpHashes = await getKnownNonAdminIpHashes();
    const signalWhere = {
      ...where,
      ipHash: {
        in: allowedIpHashes,
      },
    };

    const [blockSignals, total] = await Promise.all([
      prisma.trafficBlockSignal.findMany({
        where: signalWhere,
        orderBy: { lastSeenAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trafficBlockSignal.count({ where: signalWhere }),
    ]);

    return res.json({ page, limit, total, blockSignals });
  } catch (error) {
    console.error('Failed to fetch block signals:', error);
    return res.status(500).json({ error: 'Failed to fetch block signals.' });
  }
};

const updateBlockSignal = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid block signal id.' });
    }

    const data = {};
    if (typeof req.body.status === 'string' && req.body.status.trim()) {
      data.status = req.body.status.trim().slice(0, 50);
    }
    if (typeof req.body.notes === 'string') {
      data.notes = req.body.notes.trim().slice(0, 1000);
    }

    const signal = await prisma.trafficBlockSignal.update({
      where: { id },
      data,
    });

    return res.json({ blockSignal: signal });
  } catch (error) {
    console.error('Failed to update block signal:', error);
    return res.status(500).json({ error: 'Failed to update block signal.' });
  }
};

module.exports = {
  getOverview,
  getLiveSessions,
  getFunnel,
  getSourceBreakdown,
  getSuburbInsights,
  getTrafficQuality,
  getSessions,
  getSessionDetail,
  getBlockSignals,
  updateBlockSignal,
};
