const prisma = require('../lib/prisma');
const { DISPATCH_ACTORS, DISPATCH_STATUSES } = require('../lib/dispatch/constants');
const { isKnownStatus, transitionDispatchJob } = require('../lib/dispatch/stateMachine');
const { syncUpcomingCalendarEvents } = require('../services/dispatch/dispatchSyncService');
const { isCalendarEnabled, getCalendarConfig } = require('../services/dispatch/googleCalendarClient');

const parseId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

exports.getDispatchJobs = async (req, res) => {
  const status = String(req.query.status || '').trim();
  const where = {};
  if (status && isKnownStatus(status)) where.status = status;

  const now = new Date();
  const lookaheadHours = Number(process.env.DISPATCH_LOOKAHEAD_HOURS || 168);
  where.OR = [
    { pickupAt: null },
    { pickupAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000), lte: new Date(now.getTime() + lookaheadHours * 60 * 60 * 1000) } },
  ];

  try {
    const jobs = await prisma.dispatchJob.findMany({
      where,
      orderBy: [{ pickupAt: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });

    return res.json({
      jobs,
      calendar: {
        enabled: isCalendarEnabled(),
        calendarId: getCalendarConfig().calendarId,
      },
    });
  } catch (error) {
    console.error('Failed to fetch dispatch jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch dispatch jobs' });
  }
};

exports.getDispatchJob = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Valid dispatch job ID is required' });

  try {
    const job = await prisma.dispatchJob.findUnique({
      where: { id },
      include: {
        auditEvents: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!job) return res.status(404).json({ error: 'Dispatch job not found' });
    return res.json({ job });
  } catch (error) {
    console.error('Failed to fetch dispatch job:', error);
    return res.status(500).json({ error: 'Failed to fetch dispatch job' });
  }
};

exports.syncDispatchCalendar = async (req, res) => {
  try {
    const result = await syncUpcomingCalendarEvents();
    return res.json(result);
  } catch (error) {
    console.error('Manual dispatch calendar sync failed:', error);
    return res.status(500).json({ error: 'Failed to sync dispatch calendar' });
  }
};

exports.transitionDispatchJobStatus = async (req, res) => {
  const id = parseId(req.params.id);
  const toStatus = String(req.body.status || '').trim().toUpperCase();
  if (!id) return res.status(400).json({ error: 'Valid dispatch job ID is required' });
  if (!isKnownStatus(toStatus)) return res.status(400).json({ error: 'Valid dispatch status is required' });

  try {
    const job = await transitionDispatchJob(prisma, id, toStatus, {
      actor: DISPATCH_ACTORS.OWNER,
      eventType: 'MANUAL_STATUS_CHANGE',
      details: { adminId: req.admin?.sub || null },
    });
    return res.json({ job });
  } catch (error) {
    const statusCode = error.statusCode || (String(error.message || '').startsWith('Invalid dispatch transition') ? 409 : 500);
    if (statusCode >= 500) console.error('Failed to transition dispatch job:', error);
    return res.status(statusCode).json({ error: error.message || 'Failed to update dispatch job' });
  }
};

exports.getDispatchMeta = (req, res) => res.json({
  statuses: Object.values(DISPATCH_STATUSES),
  calendar: {
    enabled: isCalendarEnabled(),
    calendarId: getCalendarConfig().calendarId,
    timezone: getCalendarConfig().timezone,
    lookaheadHours: getCalendarConfig().lookaheadHours,
  },
});
