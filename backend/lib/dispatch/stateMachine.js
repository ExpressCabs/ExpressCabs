const { DISPATCH_ACTORS, DISPATCH_STATUSES } = require('./constants');

const allowedTransitions = {
  [DISPATCH_STATUSES.NEW]: [
    DISPATCH_STATUSES.READY_FOR_DISPATCH,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.READY_FOR_DISPATCH]: [
    DISPATCH_STATUSES.MAIN_DISPATCHED,
    DISPATCH_STATUSES.DRIVER_SELECTED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.MAIN_DISPATCHED]: [
    DISPATCH_STATUSES.EXCESS_DISPATCHED,
    DISPATCH_STATUSES.DRIVER_SELECTED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.EXCESS_DISPATCHED]: [
    DISPATCH_STATUSES.LOCAL_DISPATCHED,
    DISPATCH_STATUSES.DRIVER_SELECTED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.LOCAL_DISPATCHED]: [
    DISPATCH_STATUSES.DRIVER_SELECTED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.DRIVER_SELECTED]: [
    DISPATCH_STATUSES.DETAILS_SENT,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.DETAILS_SENT]: [
    DISPATCH_STATUSES.ETA_CONFIRMED,
    DISPATCH_STATUSES.COVERED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.ETA_CONFIRMED]: [
    DISPATCH_STATUSES.COVERED,
    DISPATCH_STATUSES.PICKED_UP,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.COVERED]: [
    DISPATCH_STATUSES.PICKED_UP,
    DISPATCH_STATUSES.COMPLETED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.PICKED_UP]: [
    DISPATCH_STATUSES.COMPLETED,
    DISPATCH_STATUSES.NEEDS_REVIEW,
  ],
  [DISPATCH_STATUSES.NEEDS_REVIEW]: [
    DISPATCH_STATUSES.READY_FOR_DISPATCH,
    DISPATCH_STATUSES.MAIN_DISPATCHED,
    DISPATCH_STATUSES.CANCELLED,
  ],
  [DISPATCH_STATUSES.CANCELLED]: [],
  [DISPATCH_STATUSES.COMPLETED]: [],
};

const timestampFieldByStatus = {
  [DISPATCH_STATUSES.MAIN_DISPATCHED]: 'dispatchedMainAt',
  [DISPATCH_STATUSES.EXCESS_DISPATCHED]: 'dispatchedExcessAt',
  [DISPATCH_STATUSES.LOCAL_DISPATCHED]: 'dispatchedLocalAt',
  [DISPATCH_STATUSES.DRIVER_SELECTED]: 'assignedAt',
  [DISPATCH_STATUSES.PICKED_UP]: 'pickedUpAt',
  [DISPATCH_STATUSES.COMPLETED]: 'completedAt',
};

const isKnownStatus = (status) => Object.values(DISPATCH_STATUSES).includes(status);

const assertValidTransition = (fromStatus, toStatus) => {
  if (!isKnownStatus(toStatus)) {
    throw new Error(`Unknown dispatch status: ${toStatus}`);
  }
  if (fromStatus === toStatus) return;
  const allowed = allowedTransitions[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Invalid dispatch transition from ${fromStatus} to ${toStatus}`);
  }
};

const transitionDispatchJob = async (prisma, jobId, toStatus, {
  actor = DISPATCH_ACTORS.OWNER,
  eventType = 'STATUS_CHANGED',
  details = {},
} = {}) => {
  const job = await prisma.dispatchJob.findUnique({ where: { id: Number(jobId) } });
  if (!job) {
    const error = new Error('Dispatch job not found');
    error.statusCode = 404;
    throw error;
  }

  assertValidTransition(job.status, toStatus);
  const now = new Date();
  const data = { status: toStatus };
  const timestampField = timestampFieldByStatus[toStatus];
  if (timestampField && !job[timestampField]) data[timestampField] = now;

  const [updated] = await prisma.$transaction([
    prisma.dispatchJob.update({ where: { id: job.id }, data }),
    prisma.dispatchAudit.create({
      data: {
        dispatchJobId: job.id,
        eventType,
        fromStatus: job.status,
        toStatus,
        actor,
        details,
      },
    }),
  ]);

  return updated;
};

module.exports = {
  allowedTransitions,
  assertValidTransition,
  isKnownStatus,
  transitionDispatchJob,
};
