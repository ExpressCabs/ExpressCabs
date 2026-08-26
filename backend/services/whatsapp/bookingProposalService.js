const prisma = require('../../lib/prisma');
const { createCalendarEvent } = require('../dispatch/googleCalendarClient');
const { parseBookingProposal } = require('./ownerParsers');
const { buildProposalSummary } = require('./whatsappMessageBuilder');
const whatsappService = require('./whatsappService');
const { estimateDispatchFare } = require('../dispatch/dispatchFareEstimator');

const PENDING = 'PENDING';
const CONFIRMED = 'CONFIRMED';
const CANCELLED = 'CANCELLED';

const proposalExpiry = () => new Date(Date.now() + Number(process.env.DISPATCH_PROPOSAL_EXPIRE_MINUTES || 30) * 60 * 1000);

const createOrUpdateProposal = async ({ ownerPhone, body, parsedBooking, prismaClient = prisma, now = new Date() }) => {
  let parsed = parsedBooking || parseBookingProposal(body, now);
  if (!parsed) return null;
  if (!parsed.fareType && parsed.pickup && parsed.dropoff && parsed.pickupAt) {
    const estimatedFare = await estimateDispatchFare(parsed);
    if (estimatedFare) parsed = { ...parsed, ...estimatedFare };
  }
  if (!parsed.fareType) {
    parsed = { ...parsed, missing: [...new Set([...(parsed.missing || []), 'fare'])] };
  }

  const existing = await prismaClient.dispatchBookingProposal.findFirst({
    where: { ownerPhone, status: PENDING, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });

  const data = {
    ownerPhone,
    status: PENDING,
    originalMessage: body,
    parsed,
    customerName: parsed.customerName,
    customerPhone: parsed.customerPhone,
    pickup: parsed.pickup,
    pickupSuburb: parsed.pickupSuburb,
    dropoff: parsed.dropoff,
    dropoffSuburb: parsed.dropoffSuburb,
    pickupAt: parsed.pickupAt,
    passengerCount: parsed.passengerCount,
    minimumFare: parsed.minimumFare,
    fareType: parsed.fareType,
    fareAmount: parsed.fareAmount,
    paymentMethod: parsed.paymentMethod,
    boa: parsed.boa,
    notes: parsed.notes,
    expiresAt: proposalExpiry(),
  };

  const proposal = existing
    ? await prismaClient.dispatchBookingProposal.update({ where: { id: existing.id }, data })
    : await prismaClient.dispatchBookingProposal.create({ data });

  await whatsappService.sendText({
    to: ownerPhone,
    body: buildProposalSummary(proposal),
    bookingProposalId: proposal.id,
    messageType: 'BOOKING_PROPOSAL_SUMMARY',
  });
  return proposal;
};

const buildCalendarDescription = (proposal) => [
  proposal.customerName ? `Customer: ${proposal.customerName}` : null,
  proposal.customerPhone ? `Phone: ${proposal.customerPhone}` : null,
  proposal.pickup ? `Pickup: ${proposal.pickup}` : null,
  proposal.dropoff ? `Dropoff: ${proposal.dropoff}` : null,
  proposal.passengerCount ? `Passengers: ${proposal.passengerCount}` : null,
  proposal.fareType && proposal.fareAmount ? `${proposal.fareType === 'COLLECT' ? 'Collect' : 'Min'} $${Number(proposal.fareAmount)}` : null,
  proposal.paymentMethod && proposal.paymentMethod !== 'UNKNOWN' ? `Payment: ${proposal.paymentMethod}` : null,
  proposal.boa ? 'BOA' : null,
  ...(Array.isArray(proposal.notes) ? proposal.notes : []),
  '',
  'Original owner WhatsApp:',
  proposal.originalMessage,
].filter((line) => line !== null && line !== undefined).join('\n');

const confirmProposal = async ({ ownerPhone, prismaClient = prisma, now = new Date() }) => {
  const proposal = await prismaClient.dispatchBookingProposal.findFirst({
    where: { ownerPhone, status: PENDING, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });
  if (!proposal) return null;
  const missing = Array.isArray(proposal.parsed?.missing) ? proposal.parsed.missing : [];
  if (missing.length) {
    await whatsappService.sendText({
      to: ownerPhone,
      body: `I cannot add this booking yet. Missing: ${missing.join(', ')}. Send the missing details, then reply CONFIRM.`,
      bookingProposalId: proposal.id,
      messageType: 'BOOKING_PROPOSAL_INCOMPLETE',
    });
    return null;
  }

  const event = await createCalendarEvent({
    title: `${proposal.pickupSuburb || 'Pickup'} - ${proposal.dropoffSuburb || 'Dropoff'}`,
    description: buildCalendarDescription(proposal),
    startTime: proposal.pickupAt,
    endTime: new Date(new Date(proposal.pickupAt).getTime() + 60 * 60 * 1000),
  });

  const updated = await prismaClient.dispatchBookingProposal.update({
    where: { id: proposal.id },
    data: { status: CONFIRMED, calendarEventId: event.id || null },
  });
  await whatsappService.sendText({
    to: ownerPhone,
    body: `Booking added to Google Calendar.${event.id ? `\nEvent: ${event.id}` : ''}`,
    bookingProposalId: proposal.id,
    messageType: 'BOOKING_PROPOSAL_CONFIRMED',
  });
  return updated;
};

const cancelProposal = async ({ ownerPhone, prismaClient = prisma, now = new Date() }) => {
  const proposal = await prismaClient.dispatchBookingProposal.findFirst({
    where: { ownerPhone, status: PENDING, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
  });
  if (!proposal) return null;

  const updated = await prismaClient.dispatchBookingProposal.update({
    where: { id: proposal.id },
    data: { status: CANCELLED },
  });
  await whatsappService.sendText({
    to: ownerPhone,
    body: 'Booking proposal cancelled.',
    bookingProposalId: proposal.id,
    messageType: 'BOOKING_PROPOSAL_CANCELLED',
  });
  return updated;
};

module.exports = {
  CANCELLED,
  CONFIRMED,
  PENDING,
  buildCalendarDescription,
  cancelProposal,
  confirmProposal,
  createOrUpdateProposal,
};
