const { VEHICLE_REQUIREMENTS } = require('./constants');

const formatDispatchTime = (dateInput) => {
  if (!dateInput) return 'Ready time TBC';
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Australia/Melbourne',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateInput));
};

const publicVehicleNote = (requirement) => {
  if (!requirement || requirement === VEHICLE_REQUIREMENTS.ANY_SUITABLE) return null;
  return requirement.replace(/_/g, '/');
};

const formatFareInstruction = (job) => {
  const amount = job.fareAmount ?? job.minimumFare;
  if (amount === null || amount === undefined) return null;
  const label = job.fareType === 'COLLECT' ? 'Collect' : 'Min';
  return `${label} $${Number(amount).toFixed(Number(amount) % 1 === 0 ? 0 : 2)}`;
};

const formatPaymentMethod = (paymentMethod) => {
  if (!paymentMethod || paymentMethod === 'UNKNOWN') return null;
  const labels = {
    CASH: 'Cash', CARD: 'Card', CASH_OR_CARD: 'Cash or Card', CABCHARGE: 'Cabcharge',
    MPTP_CARD: 'MPTP/Card', MPTP_CABCHARGE: 'MPTP/Cabcharge',
  };
  return labels[paymentMethod] || null;
};

const redactCustomerPhones = (value) => String(value || '')
  .replace(/(?:\+?61|0)4(?:[\s-]?\d){8}\b/g, '[customer phone withheld]');

const buildPublicDispatchMessage = (job) => {
  const lines = [
    `Ready ${formatDispatchTime(job.pickupAt)}`,
    `• ${job.pickupSuburb || 'Pickup area TBC'}`,
    'to',
    `• ${job.dropoffSuburb || 'Drop-off area TBC'}`,
  ];

  const fareInstruction = formatFareInstruction(job);
  if (fareInstruction) lines.push(fareInstruction);
  if (job.boa) lines.push('BOA');
  if (job.passengerCount) lines.push(`${job.passengerCount} pax`);
  const paymentMethod = formatPaymentMethod(job.paymentMethod);
  if (paymentMethod) lines.push(paymentMethod);

  const vehicleNote = publicVehicleNote(job.vehicleRequirement);
  if (vehicleNote) lines.push(vehicleNote);
  const publicNotes = Array.isArray(job.specialNotes)
    ? job.specialNotes.filter((note) => !/(?:\+?61|0)4(?:[\s-]?\d){8}/.test(note))
    : [];
  if (publicNotes.length) lines.push(`Notes: ${publicNotes.join(' | ')}`);

  return lines.join('\n');
};

const buildPrivateDriverMessage = (job) => {
  const lines = [
    'Prime Cabs job details',
    `Ready: ${formatDispatchTime(job.pickupAt)}`,
    `Pickup: ${job.pickup || 'TBC'}`,
    `Drop-off: ${job.dropoff || 'TBC'}`,
  ];

  if (job.passengerCount) lines.push(`Passengers: ${job.passengerCount}`);
  if (job.passengerAssumption) lines.push(`Passenger assumption: ${job.passengerAssumption}`);
  if (job.luggage) lines.push(`Luggage: ${job.luggage}`);
  if (job.vehicleRequirement && job.vehicleRequirement !== VEHICLE_REQUIREMENTS.ANY_SUITABLE) {
    lines.push(`Vehicle: ${job.vehicleRequirement.replace(/_/g, '/')}`);
  }
  const fareInstruction = formatFareInstruction(job);
  if (fareInstruction) lines.push(`Fare: ${fareInstruction}`);
  const paymentMethod = formatPaymentMethod(job.paymentMethod);
  if (paymentMethod) lines.push(`Payment: ${paymentMethod}`);
  if (job.boa) lines.push('BOA');
  if (Array.isArray(job.specialNotes) && job.specialNotes.length) lines.push(`Notes: ${redactCustomerPhones(job.specialNotes.join(' | '))}`);
  lines.push('Original calendar description:');
  lines.push(redactCustomerPhones(job.originalDescription));

  return lines.join('\n');
};

module.exports = {
  buildPrivateDriverMessage,
  buildPublicDispatchMessage,
  formatDispatchTime,
};
