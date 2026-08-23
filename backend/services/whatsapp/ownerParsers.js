const { normalizeAuPhone } = require('../../lib/validators');
const { titleCase } = require('../../lib/dispatch/parser');

const parseDriverDetails = (body = '') => {
  const text = String(body || '').replace(/\r/g, '\n').trim();
  const unitMatch = text.match(/\b(?:unit\s*)?(U\d{2,5}|[A-Z]{1,3}\d{2,5})\b/i);
  const etaMatch = text.match(/\bETA\s*(\d{1,3})(?:\s*(?:min|mins|minutes?))?\b/i)
    || text.match(/\b(\d{1,3})\s*(?:min|mins|minutes?)\b/i);
  const phoneMatch = text.match(/(?:\+?61|0)4(?:[\s-]?\d){8}\b/);
  const nameMatch = text.match(/\b(?:driver|name)\s*:?\s*([A-Za-z][A-Za-z\s'-]{1,40})/i);

  let vehicle = null;
  const vehicleMatch = text.match(/\b((?:white|black|silver|grey|gray|red|blue|gold|green)\s+)?(camry|prius|maxi|suv|sedan|van|wagon|kluger|carnival|tesla)\b/i);
  if (vehicleMatch) vehicle = titleCase(vehicleMatch[0]);

  return {
    selectedDriverUnit: unitMatch ? unitMatch[1].toUpperCase() : null,
    selectedDriverVehicle: vehicle,
    driverEtaMinutes: etaMatch ? Number(etaMatch[1]) : null,
    selectedDriverPhone: phoneMatch ? normalizeAuPhone(phoneMatch[0]) : null,
    selectedDriverName: nameMatch ? titleCase(nameMatch[1]) : null,
    missing: {
      unit: !unitMatch,
      vehicle: !vehicle,
      eta: !etaMatch,
    },
  };
};

const parseJobId = (body = '') => {
  const match = String(body || '').match(/\bjob\s*#?\s*(\d+)\b/i);
  return match ? Number(match[1]) : null;
};

const extractAustralianPhone = (body = '') => {
  const match = String(body || '').match(/(?:\+?61|0)4(?:[\s-]?\d){8}\b/);
  return match ? normalizeAuPhone(match[0]) : null;
};

const parseBookingProposal = (body = '', now = new Date()) => {
  const text = String(body || '').trim();
  if (!/^new booking\b/i.test(text)) return null;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const first = lines[0] || '';
  const lowerFirst = first.toLowerCase();
  const pickupAt = parsePickupAt(lowerFirst, now);
  const phone = extractAustralianPhone(text);
  const customerLine = lines.find((line) => line !== lines[0] && /(?:\+?61|0)4/.test(line));
  const customerName = customerLine ? customerLine.replace(/(?:\+?61|0)4(?:[\s-]?\d){8}\b/, '').trim() || null : null;
  const routeLine = lines.find((line) => /\bto\b/i.test(line) && !/^new booking\b/i.test(line));
  const routeMatch = routeLine?.match(/^(.+?)\s+\bto\b\s+(.+)$/i);
  const passengerMatch = text.match(/\b(\d{1,2})\s*(?:passengers?|pax)\b/i);
  const minMatch = text.match(/\b(?:min(?:imum)?(?:\s*fare)?)\s*:?\s*\$?\s*(\d+(?:\.\d{1,2})?)\b/i);
  const notes = lines.filter((line) => /\b(card|cash|receipt|inbox|mptp|meter|early|eftpos)\b/i.test(line));
  const pickup = routeMatch ? routeMatch[1].trim() : null;
  const dropoff = routeMatch ? routeMatch[2].trim() : null;

  return {
    customerName,
    customerPhone: phone,
    pickup,
    pickupSuburb: pickup ? titleCase(pickup.split(/\s+/).slice(-1)[0]) : null,
    dropoff,
    dropoffSuburb: dropoff ? titleCase(dropoff.replace(/\bT\d+\b/i, '').trim().split(/\s+/).slice(-2).join(' ')) : null,
    pickupAt,
    passengerCount: passengerMatch ? Number(passengerMatch[1]) : null,
    minimumFare: minMatch ? Number(minMatch[1]) : null,
    notes,
    originalMessage: text,
  };
};

const parsePickupAt = (lowerFirst, now) => {
  const timeMatch = lowerFirst.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!timeMatch) return null;
  const date = new Date(now);
  if (/\btomorrow\b/i.test(lowerFirst)) date.setDate(date.getDate() + 1);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] || 0);
  const ampm = timeMatch[3].toLowerCase();
  if (ampm === 'pm' && hour !== 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  date.setHours(hour, minute, 0, 0);
  return date;
};

module.exports = {
  extractAustralianPhone,
  parseBookingProposal,
  parseDriverDetails,
  parseJobId,
};
