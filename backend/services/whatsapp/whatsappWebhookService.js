const prisma = require('../../lib/prisma');
const { normalizeAuPhone } = require('../../lib/validators');
const { DISPATCH_ACTORS, DISPATCH_STATUSES } = require('../../lib/dispatch/constants');
const { transitionDispatchJob } = require('../../lib/dispatch/stateMachine');
const whatsappService = require('./whatsappService');
const { parseBookingProposal, parseDriverDetails, parseJobId } = require('./ownerParsers');
const {
  cancelProposal,
  confirmProposal,
  createOrUpdateProposal,
} = require('./bookingProposalService');
const { sendCustomerAssignmentSmsIfNeeded } = require('../dispatch/customerAssignmentSms');

const coveredStatuses = new Set([
  DISPATCH_STATUSES.COVERED,
  DISPATCH_STATUSES.PICKED_UP,
  DISPATCH_STATUSES.COMPLETED,
  DISPATCH_STATUSES.CANCELLED,
]);

const extractMessages = (payload = {}) => {
  const messages = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        messages.push({
          providerMessageId: message.id,
          from: normalizeAuPhone(message.from || ''),
          body: message.text?.body || '',
          replyToProviderMessageId: message.context?.id || null,
          timestamp: message.timestamp,
        });
      }
    }
  }
  return messages;
};

const verifyWebhook = (query = {}) => {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return { ok: true, challenge };
  }
  return { ok: false };
};

const resolveJobForMessage = async (message, prismaClient = prisma) => {
  if (message.replyToProviderMessageId) {
    const outbound = await prismaClient.whatsAppMessage.findUnique({
      where: { providerMessageId: message.replyToProviderMessageId },
    });
    if (outbound?.dispatchJobId) return outbound.dispatchJobId;
  }

  const jobId = parseJobId(message.body);
  if (jobId) return jobId;
  return null;
};

const applyDriverDetails = async ({ jobId, details, prismaClient = prisma }) => {
  let job = await prismaClient.dispatchJob.update({
    where: { id: jobId },
    data: {
      selectedDriverUnit: details.selectedDriverUnit || undefined,
      selectedDriverVehicle: details.selectedDriverVehicle || undefined,
      selectedDriverPhone: details.selectedDriverPhone || undefined,
      selectedDriverName: details.selectedDriverName || undefined,
      driverEtaMinutes: details.driverEtaMinutes || undefined,
    },
  });

  await prismaClient.dispatchAudit.create({
    data: {
      dispatchJobId: job.id,
      eventType: 'OWNER_DRIVER_DETAILS_PARSED',
      actor: DISPATCH_ACTORS.OWNER,
      details: {
        selectedDriverUnit: details.selectedDriverUnit,
        selectedDriverVehicle: details.selectedDriverVehicle,
        selectedDriverPhone: details.selectedDriverPhone,
        selectedDriverName: details.selectedDriverName,
        driverEtaMinutes: details.driverEtaMinutes,
      },
    },
  });

  const transitions = [];
  if (!coveredStatuses.has(job.status) && job.status !== DISPATCH_STATUSES.DRIVER_SELECTED) {
    transitions.push(DISPATCH_STATUSES.DRIVER_SELECTED);
  }
  if (details.selectedDriverUnit && details.selectedDriverVehicle) transitions.push(DISPATCH_STATUSES.DETAILS_SENT);
  if (details.driverEtaMinutes) transitions.push(DISPATCH_STATUSES.ETA_CONFIRMED);
  if (details.selectedDriverUnit && details.selectedDriverVehicle && details.driverEtaMinutes) transitions.push(DISPATCH_STATUSES.COVERED);

  for (const status of transitions) {
    try {
      job = await transitionDispatchJob(prismaClient, job.id, status, {
        actor: DISPATCH_ACTORS.OWNER,
        eventType: 'OWNER_ASSIGNMENT_PROGRESS',
        details: { source: 'WHATSAPP_OWNER_REPLY' },
      });
    } catch (error) {
      if (!String(error.message || '').startsWith('Invalid dispatch transition')) throw error;
    }
  }

  const refreshed = await prismaClient.dispatchJob.findUnique({ where: { id: job.id } });
  if (refreshed?.selectedDriverUnit && refreshed?.selectedDriverVehicle && refreshed?.driverEtaMinutes) {
    await sendCustomerAssignmentSmsIfNeeded(prismaClient, refreshed);
  }

  return refreshed || job;
};

const processOwnerMessage = async (message, { prismaClient = prisma } = {}) => {
  const owner = whatsappService.getOwnerWhatsApp();
  if (!owner || message.from !== owner) {
    await prismaClient.whatsAppMessage.create({
      data: {
        direction: 'INBOUND',
        provider: 'meta',
        providerMessageId: message.providerMessageId,
        replyToProviderMessageId: message.replyToProviderMessageId,
        fromNumber: message.from,
        messageType: 'IGNORED_NON_OWNER',
        body: message.body,
        status: 'ignored',
      },
    }).catch(() => null);
    return { ignored: true };
  }

  const existing = await prismaClient.whatsAppMessage.findUnique({
    where: { providerMessageId: message.providerMessageId },
  });
  if (existing) return { duplicate: true };

  const inboundLog = await prismaClient.whatsAppMessage.create({
    data: {
      direction: 'INBOUND',
      provider: 'meta',
      providerMessageId: message.providerMessageId,
      replyToProviderMessageId: message.replyToProviderMessageId,
      fromNumber: message.from,
      messageType: 'OWNER_TEXT',
      body: message.body,
      status: 'received',
    },
  });

  const normalizedBody = String(message.body || '').trim();
  if (/^confirm$/i.test(normalizedBody)) {
    const proposal = await confirmProposal({ ownerPhone: owner, prismaClient });
    return { proposalConfirmed: Boolean(proposal) };
  }
  if (/^cancel$/i.test(normalizedBody)) {
    const proposal = await cancelProposal({ ownerPhone: owner, prismaClient });
    return { proposalCancelled: Boolean(proposal) };
  }

  if (parseBookingProposal(normalizedBody)) {
    const proposal = await createOrUpdateProposal({ ownerPhone: owner, body: normalizedBody, prismaClient });
    await prismaClient.whatsAppMessage.update({
      where: { id: inboundLog.id },
      data: { bookingProposalId: proposal.id, messageType: 'BOOKING_PROPOSAL_INPUT' },
    });
    return { proposalCreated: true, proposalId: proposal.id };
  }

  const jobId = await resolveJobForMessage(message, prismaClient);
  if (!jobId) {
    await whatsappService.sendText({
      to: owner,
      body: 'I could not match that to a dispatch job. Please reply to the correct job message or include Job <id>.',
      messageType: 'OWNER_CLARIFICATION',
    });
    return { needsClarification: true };
  }

  const details = parseDriverDetails(normalizedBody);
  await prismaClient.whatsAppMessage.update({
    where: { id: inboundLog.id },
    data: { dispatchJobId: jobId, messageType: 'OWNER_DRIVER_DETAILS_REPLY' },
  });

  if (!details.selectedDriverUnit) {
    await whatsappService.sendText({
      to: owner,
      body: [
        details.selectedDriverVehicle || details.driverEtaMinutes
          ? `Got ${[
            details.selectedDriverVehicle ? `vehicle ${details.selectedDriverVehicle}` : null,
            details.driverEtaMinutes ? `ETA ${details.driverEtaMinutes} min` : null,
          ].filter(Boolean).join(' and ')}.`
          : 'I could not find the taxi/unit number.',
        'What is the taxi/unit number?',
      ].join(' '),
      dispatchJobId: jobId,
      messageType: 'OWNER_CLARIFICATION',
    });
    return { missingUnit: true, jobId };
  }

  const job = await applyDriverDetails({ jobId, details, prismaClient });
  await whatsappService.sendText({
    to: owner,
    body: `Updated job ${job.id}: ${job.selectedDriverUnit || ''} ${job.selectedDriverVehicle || ''}${job.driverEtaMinutes ? ` ETA ${job.driverEtaMinutes} min` : ''}`.trim(),
    dispatchJobId: job.id,
    messageType: 'OWNER_ASSIGNMENT_ACK',
  });

  return { updated: true, jobId: job.id };
};

const handleWebhookPayload = async (payload, options = {}) => {
  const messages = extractMessages(payload);
  const results = [];
  for (const message of messages) {
    if (message.body) {
      results.push(await processOwnerMessage(message, options));
    }
  }
  return { processed: results.length, results };
};

module.exports = {
  applyDriverDetails,
  extractMessages,
  handleWebhookPayload,
  processOwnerMessage,
  resolveJobForMessage,
  verifyWebhook,
};
