const prisma = require('../../lib/prisma');
const { DISPATCH_STATUSES } = require('../../lib/dispatch/constants');
const whatsappService = require('../whatsapp/whatsappService');
const { buildOwnerReminderMessage } = require('../whatsapp/whatsappMessageBuilder');

const terminalStatuses = new Set([
  DISPATCH_STATUSES.COVERED,
  DISPATCH_STATUSES.PICKED_UP,
  DISPATCH_STATUSES.COMPLETED,
  DISPATCH_STATUSES.CANCELLED,
]);

const getReminderMinutes = () => String(process.env.DISPATCH_REMINDER_MINUTES || '60,35')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0)
  .sort((a, b) => b - a);

const reminderType = (minutes) => `DISPATCH_REMINDER_${minutes}`;

const sendDueDispatchReminders = async ({ prismaClient = prisma, now = new Date() } = {}) => {
  if (!whatsappService.isWhatsAppEnabled()) return { enabled: false, sent: 0, skipped: 0 };
  const owner = whatsappService.getOwnerWhatsApp();
  if (!owner) return { enabled: true, sent: 0, skipped: 0, error: 'DISPATCH_OWNER_WHATSAPP is not configured' };

  const reminders = getReminderMinutes();
  const maxMinutes = Math.max(...reminders);
  const jobs = await prismaClient.dispatchJob.findMany({
    where: {
      pickupAt: {
        gte: now,
        lte: new Date(now.getTime() + maxMinutes * 60 * 1000),
      },
      status: { notIn: Array.from(terminalStatuses) },
    },
    include: { whatsappMessages: true },
    orderBy: { pickupAt: 'asc' },
    take: 100,
  });

  let sent = 0;
  let skipped = 0;
  for (const job of jobs) {
    const minutesUntilPickup = Math.round((new Date(job.pickupAt).getTime() - now.getTime()) / 60000);
    const dueMinute = reminders.find((minutes) => minutesUntilPickup <= minutes && !job.whatsappMessages.some((message) => message.messageType === reminderType(minutes)));
    if (!dueMinute) {
      skipped += 1;
      continue;
    }
    if (dueMinute <= 30 && terminalStatuses.has(job.status)) {
      skipped += 1;
      continue;
    }

    const body = buildOwnerReminderMessage(job, dueMinute);
    const result = await whatsappService.sendText({
      to: owner,
      body,
      dispatchJobId: job.id,
      messageType: reminderType(dueMinute),
    });

    await prismaClient.dispatchAudit.create({
      data: {
        dispatchJobId: job.id,
        eventType: result.success ? 'WHATSAPP_REMINDER_SENT' : 'WHATSAPP_REMINDER_FAILED',
        actor: 'SYSTEM',
        details: { minutes: dueMinute, providerMessageId: result.providerMessageId || null, error: result.error || null },
      },
    });

    if (result.success) sent += 1;
    else skipped += 1;
  }

  return { enabled: true, sent, skipped };
};

let reminderTimer = null;
const startDispatchReminderPolling = () => {
  if (reminderTimer) return reminderTimer;
  const run = () => sendDueDispatchReminders().catch((error) => {
    console.error('Dispatch reminder polling failed:', error);
  });
  reminderTimer = setInterval(run, 60 * 1000);
  run();
  return reminderTimer;
};

module.exports = {
  getReminderMinutes,
  sendDueDispatchReminders,
  startDispatchReminderPolling,
};
