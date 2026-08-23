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

const buildPublicDispatchMessage = (job) => {
  const lines = [
    `Ready ${formatDispatchTime(job.pickupAt)}`,
    `• ${job.pickupSuburb || 'Pickup area TBC'}`,
    'to',
    `• ${job.dropoffSuburb || 'Drop-off area TBC'}`,
  ];

  if (job.minimumFare !== null && job.minimumFare !== undefined) {
    lines.push(`Min $${Number(job.minimumFare).toFixed(Number(job.minimumFare) % 1 === 0 ? 0 : 2)}`);
  }

  const vehicleNote = publicVehicleNote(job.vehicleRequirement);
  if (vehicleNote) lines.push(vehicleNote);
  if (Array.isArray(job.specialNotes) && job.specialNotes.some((note) => /card|receipt|inbox|mptp/i.test(note))) {
    lines.push('Mptp/Card Receipt Inbox');
  }

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
  if (job.minimumFare !== null && job.minimumFare !== undefined) lines.push(`Minimum fare: $${Number(job.minimumFare)}`);
  if (Array.isArray(job.specialNotes) && job.specialNotes.length) lines.push(`Notes: ${job.specialNotes.join(' | ')}`);
  lines.push('Original calendar description:');
  lines.push(job.originalDescription || '');

  return lines.join('\n');
};

module.exports = {
  buildPrivateDriverMessage,
  buildPublicDispatchMessage,
  formatDispatchTime,
};
