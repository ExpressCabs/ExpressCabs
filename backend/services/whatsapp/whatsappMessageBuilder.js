const { buildPublicDispatchMessage } = require('../../lib/dispatch/messageBuilders');

const formatOwnerTime = (dateInput) => {
  if (!dateInput) return 'Time TBC';
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Australia/Melbourne',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateInput));
};

const routeLine = (job) => `${job.pickupSuburb || 'Pickup TBC'} -> ${job.dropoffSuburb || 'Drop-off TBC'}`;

const fareLine = (job) => (
  job.minimumFare !== null && job.minimumFare !== undefined
    ? `Min $${Number(job.minimumFare).toFixed(Number(job.minimumFare) % 1 === 0 ? 0 : 2)}`
    : null
);

const passengerLine = (job) => {
  if (job.passengerCount) return `Passengers: ${job.passengerCount}`;
  if (job.passengerAssumption) return 'Passengers: up to 4';
  return null;
};

const buildOwnerReminderMessage = (job, minutesBefore) => {
  const warning = minutesBefore <= 35 ? `Job still not covered\nPickup in ${minutesBefore} min` : `Upcoming job in ${minutesBefore} min`;
  const lines = [
    warning,
    '',
    formatOwnerTime(job.pickupAt),
    routeLine(job),
    fareLine(job),
    passengerLine(job),
    `Vehicle: ${job.vehicleRequirement === 'ANY_SUITABLE' ? 'Any suitable' : job.vehicleRequirement}`,
    '',
    'PUBLIC DISPATCH:',
    job.publicDispatchText || buildPublicDispatchMessage(job),
    '',
    `Status: ${job.status}`,
  ].filter((line) => line !== null && line !== undefined);

  if (minutesBefore <= 35) {
    lines.push('');
    lines.push('Reply directly to this WhatsApp message with driver details once covered.');
  }

  return lines.join('\n');
};

const buildAssignmentSms = ({ vehicle, unit, etaMinutes }) => [
  'Prime Cabs: Your taxi is confirmed.',
  vehicle ? `Vehicle: ${vehicle}` : null,
  unit ? `Taxi: ${unit}` : null,
  etaMinutes ? `ETA: approx. ${etaMinutes} min` : null,
].filter(Boolean).join('\n');

const buildProposalSummary = (proposal) => {
  const parsed = proposal.parsed || proposal;
  const lines = [
    'I understood:',
    '',
    parsed.pickupAt ? `Date: ${new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', dateStyle: 'medium' }).format(new Date(parsed.pickupAt))}` : 'Date: TBC',
    parsed.pickupAt ? `Time: ${new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', timeStyle: 'short' }).format(new Date(parsed.pickupAt))}` : 'Time: TBC',
    `Pickup: ${parsed.pickup || 'TBC'}`,
    `Drop-off: ${parsed.dropoff || 'TBC'}`,
    parsed.customerName ? `Customer: ${parsed.customerName}` : null,
    parsed.customerPhone ? `Phone: ${parsed.customerPhone}` : null,
    parsed.passengerCount ? `Passengers: ${parsed.passengerCount}` : null,
    parsed.minimumFare ? `Min fare: $${Number(parsed.minimumFare)}` : null,
    Array.isArray(parsed.notes) && parsed.notes.length ? `Notes: ${parsed.notes.join(' | ')}` : null,
    '',
    'Reply CONFIRM to add it, or CANCEL.',
  ].filter(Boolean);
  return lines.join('\n');
};

module.exports = {
  buildAssignmentSms,
  buildOwnerReminderMessage,
  buildProposalSummary,
};
