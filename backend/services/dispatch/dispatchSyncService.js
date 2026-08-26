const prisma = require('../../lib/prisma');
const { DISPATCH_ACTORS, DISPATCH_STATUSES } = require('../../lib/dispatch/constants');
const { parseCalendarBooking } = require('../../lib/dispatch/parser');
const {
  buildPrivateDriverMessage,
  buildPublicDispatchMessage,
} = require('../../lib/dispatch/messageBuilders');
const { listUpcomingEvents, isCalendarEnabled } = require('./googleCalendarClient');

const calendarEventUpdatedAt = (event) => {
  if (!event.updated) return null;
  const parsed = new Date(event.updated);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toJobData = (event, parsed) => {
  const base = {
    calendarEventId: event.id,
    calendarRecurringEventId: event.recurringEventId || null,
    calendarOriginalStart: event.originalStartTime?.dateTime ? new Date(event.originalStartTime.dateTime) : null,
    source: 'GOOGLE_CALENDAR',
    status: parsed.status,
    title: parsed.title || event.summary || '',
    originalDescription: parsed.originalDescription,
    pickup: parsed.pickup,
    pickupSuburb: parsed.pickupSuburb,
    dropoff: parsed.dropoff,
    dropoffSuburb: parsed.dropoffSuburb,
    pickupAt: parsed.pickupAt,
    passengerCount: parsed.passengerCount,
    passengerAssumption: parsed.passengerAssumption,
    luggage: parsed.luggage,
    vehicleRequirement: parsed.vehicleRequirement,
    minimumFare: parsed.minimumFare,
    fareType: parsed.fareType,
    fareAmount: parsed.fareAmount,
    paymentMethod: parsed.paymentMethod,
    boa: parsed.boa,
    specialNotes: parsed.specialNotes,
    calendarSyncedAt: new Date(),
    calendarUpdatedAt: calendarEventUpdatedAt(event),
  };

  return {
    ...base,
    publicDispatchText: buildPublicDispatchMessage(base),
    privateDriverText: buildPrivateDriverMessage(base),
  };
};

const getComparableFields = (job) => ({
  title: job.title,
  originalDescription: job.originalDescription,
  pickup: job.pickup,
  pickupSuburb: job.pickupSuburb,
  dropoff: job.dropoff,
  dropoffSuburb: job.dropoffSuburb,
  pickupAt: job.pickupAt ? new Date(job.pickupAt).toISOString() : null,
  passengerCount: job.passengerCount,
  passengerAssumption: job.passengerAssumption,
  luggage: job.luggage,
  vehicleRequirement: job.vehicleRequirement,
  minimumFare: job.minimumFare === null || job.minimumFare === undefined ? null : Number(job.minimumFare),
  fareType: job.fareType,
  fareAmount: job.fareAmount === null || job.fareAmount === undefined ? null : Number(job.fareAmount),
  paymentMethod: job.paymentMethod,
  boa: Boolean(job.boa),
  specialNotes: job.specialNotes || [],
  publicDispatchText: job.publicDispatchText,
  privateDriverText: job.privateDriverText,
});

const hasMeaningfulChange = (existing, nextData) => (
  JSON.stringify(getComparableFields(existing)) !== JSON.stringify(getComparableFields(nextData))
);

const syncCalendarEvent = async (event, { prismaClient = prisma } = {}) => {
  const parsed = parseCalendarBooking(event);
  const data = toJobData(event, parsed);
  const existing = await prismaClient.dispatchJob.findUnique({
    where: { calendarEventId: event.id },
  });

  if (!existing) {
    const created = await prismaClient.dispatchJob.create({ data });
    await prismaClient.dispatchAudit.create({
      data: {
        dispatchJobId: created.id,
        eventType: 'CALENDAR_EVENT_IMPORTED',
        toStatus: created.status,
        actor: DISPATCH_ACTORS.SYSTEM,
        details: { calendarEventId: event.id, needsReview: parsed.needsReview },
      },
    });
    return { action: 'created', job: created };
  }

  const nextData = {
    ...data,
    status: existing.status === DISPATCH_STATUSES.NEEDS_REVIEW || parsed.status === DISPATCH_STATUSES.NEEDS_REVIEW
      ? parsed.status
      : existing.status,
  };

  const changed = hasMeaningfulChange(existing, nextData);
  const updated = await prismaClient.dispatchJob.update({
    where: { id: existing.id },
    data: changed ? nextData : { calendarSyncedAt: new Date(), calendarUpdatedAt: data.calendarUpdatedAt },
  });

  if (changed) {
    await prismaClient.dispatchAudit.create({
      data: {
        dispatchJobId: existing.id,
        eventType: 'CALENDAR_EVENT_UPDATED',
        fromStatus: existing.status,
        toStatus: updated.status,
        actor: DISPATCH_ACTORS.SYSTEM,
        details: { calendarEventId: event.id },
      },
    });
  }

  return { action: changed ? 'updated' : 'unchanged', job: updated };
};

const syncUpcomingCalendarEvents = async ({ prismaClient = prisma, fetchImpl, now } = {}) => {
  const calendarResult = await listUpcomingEvents({ fetchImpl, now });
  if (!calendarResult.enabled) {
    return { enabled: false, created: 0, updated: 0, unchanged: 0, total: 0 };
  }

  const counts = { enabled: true, created: 0, updated: 0, unchanged: 0, total: calendarResult.events.length };
  for (const event of calendarResult.events) {
    if (event.status === 'cancelled') continue;
    const result = await syncCalendarEvent(event, { prismaClient });
    counts[result.action] += 1;
  }
  return counts;
};

let pollTimer = null;
const startDispatchCalendarPolling = () => {
  if (!isCalendarEnabled() || pollTimer) return null;
  const pollSeconds = Math.max(Number(process.env.DISPATCH_CALENDAR_POLL_SECONDS || 90), 30);
  const run = () => syncUpcomingCalendarEvents().catch((error) => {
    console.error('Dispatch calendar sync failed:', error);
  });
  pollTimer = setInterval(run, pollSeconds * 1000);
  run();
  return pollTimer;
};

module.exports = {
  startDispatchCalendarPolling,
  syncCalendarEvent,
  syncUpcomingCalendarEvents,
  toJobData,
};
