const { normalizeAuPhone } = require('../../lib/validators');
const { titleCase } = require('../../lib/dispatch/parser');
const { parseFareInstruction, parsePaymentMethod } = require('../../lib/dispatch/farePolicy');

const getMelbourneClockParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-AU', {
    timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Australia/Melbourne',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
);

const clockTimeToEtaMinutes = (hour, minute, ampm, now) => {
  let targetHour = Number(hour);
  if (ampm.toLowerCase() === 'pm' && targetHour !== 12) targetHour += 12;
  if (ampm.toLowerCase() === 'am' && targetHour === 12) targetHour = 0;
  const current = getMelbourneClockParts(now);
  let difference = (targetHour * 60 + Number(minute || 0)) - (current.hour * 60 + current.minute);
  if (difference < -5) difference += 24 * 60;
  return difference >= 0 && difference <= 180 ? difference : null;
};

const getMelbourneDateParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-AU', {
    timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'Australia/Melbourne',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
);

const melbourneWallTimeToDate = ({ year, month, day, hour, minute }) => {
  const timeZone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'Australia/Melbourne';
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = new Date(desiredUtc);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(candidate).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
    const representedUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    candidate = new Date(candidate.getTime() + desiredUtc - representedUtc);
  }
  return candidate;
};

const parseDriverDetails = (body = '', now = new Date()) => {
  const text = String(body || '').replace(/\r/g, '\n').trim();
  const unitMatch = text.match(/\b(?:unit\s*)?(U\d{2,5}|[A-Z]{1,3}\d{2,5}|\d{2,5}[A-Z])\b/i);
  const etaMatch = text.match(/\bETA\s*(\d{1,3})(?:\s*(?:min|mins|minutes?))?\b/i)
    || text.match(/\b(\d{1,3})\s*(?:min|mins|minutes?)\b/i);
  const clockMatch = !etaMatch && text.match(/\b(\d{1,2})(?::(\d{2}))\s*(am|pm)\b/i);
  const phoneMatch = text.match(/(?:\+?61|0)4(?:[\s-]?\d){8}\b/);
  const nameMatch = text.match(/\b(?:driver|name)\s*:?\s*([A-Za-z][A-Za-z\s'-]{1,40})/i);

  let vehicle = null;
  const vehicleMatch = text.match(/\b((?:white|black|silver|grey|gray|red|blue|gold|green)\s+)?(camry|prius|maxi|suv|sedan|van|wagon|kluge(?:r)?|carnival|tesla)\b/i);
  if (vehicleMatch) vehicle = titleCase(vehicleMatch[0]);

  const driverEtaMinutes = etaMatch
    ? Number(etaMatch[1])
    : clockMatch ? clockTimeToEtaMinutes(clockMatch[1], clockMatch[2], clockMatch[3], now) : null;

  return {
    selectedDriverUnit: unitMatch ? unitMatch[1].toUpperCase() : null,
    selectedDriverVehicle: vehicle,
    driverEtaMinutes,
    selectedDriverPhone: phoneMatch ? normalizeAuPhone(phoneMatch[0]) : null,
    selectedDriverName: nameMatch ? titleCase(nameMatch[1]) : null,
    missing: {
      unit: !unitMatch,
      vehicle: !vehicle,
      eta: !driverEtaMinutes,
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
  const looksLikeBooking = /^new booking\b/i.test(text)
    || (/\bp\s*:/i.test(text) && /\bd\s*:/i.test(text))
    || (/\bto\b/i.test(text) && /\b(?:today|tomorrow|\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i.test(text));
  if (!looksLikeBooking) return null;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const pickupAt = parsePickupAt(text.toLowerCase(), now);
  const phone = extractAustralianPhone(text);
  const customerLine = lines.find((line) => line !== lines[0] && /(?:\+?61|0)4/.test(line));
  const customerName = customerLine ? customerLine.replace(/(?:\+?61|0)4(?:[\s-]?\d){8}\b/, '').trim() || null : null;
  const structuredRoute = text.match(/\bp\s*:\s*(.+?)\s+\bd\s*:\s*(.+?)(?=\s+\b(?:today|tomorrow|\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}\s*(?:pax|passengers?)|min(?:imum)?|collect|cash|card|cabcharge|mptp|notes?)\b|$)/is);
  const routeLine = lines.find((line) => /\bto\b/i.test(line) && !/^new booking\b/i.test(line)) || lines[0];
  const routeMatch = routeLine?.replace(/^new booking\s*/i, '').match(/^(.+?)\s+\bto\b\s+(.+?)(?=\s+\b(?:today|tomorrow|\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}\s*(?:pax|passengers?)|min(?:imum)?|collect|cash|card|cabcharge|mptp)\b|$)/i);
  const passengerMatch = text.match(/\b(\d{1,2})\s*(?:passengers?|pax)\b/i);
  const fare = parseFareInstruction(text);
  const paymentMethod = parsePaymentMethod(text);
  const notesMatch = text.match(/\bnotes?\s*:\s*(.+)$/im);
  const customerNoteMatch = text.match(/\bcustomer\s+(?:has|needs|requests?)\s+(.+?)(?=\s*[,;]\s*(?:min|collect|cash|card|cabcharge|mptp)\b|$)/i);
  const notes = notesMatch
    ? [notesMatch[1].trim()]
    : customerNoteMatch ? [customerNoteMatch[1].trim()] : lines.filter((line) => /\b(receipt|inbox|meter|early)\b/i.test(line));
  const pickup = (structuredRoute?.[1] || routeMatch?.[1] || '').trim() || null;
  let dropoff = (structuredRoute?.[2] || routeMatch?.[2] || '').trim() || null;
  if (/^airport$/i.test(dropoff || '')) dropoff = 'Melbourne Airport';

  const missing = [];
  if (!pickup) missing.push('pickup');
  if (!dropoff) missing.push('dropoff');
  if (!pickupAt) missing.push('pickupAt');

  return {
    customerName,
    customerPhone: phone,
    pickup,
    pickupSuburb: pickup ? titleCase(pickup.split(/\s+/).slice(-1)[0]) : null,
    dropoff,
    dropoffSuburb: dropoff ? titleCase(dropoff.replace(/\bT\d+\b/i, '').trim().split(/\s+/).slice(-2).join(' ')) : null,
    pickupAt,
    passengerCount: passengerMatch ? Number(passengerMatch[1]) : null,
    fareType: fare.fareType,
    fareAmount: fare.fareAmount,
    minimumFare: fare.fareType === 'MINIMUM' ? fare.fareAmount : null,
    paymentMethod,
    boa: false,
    notes,
    missing,
    originalMessage: text,
  };
};

const parsePickupAt = (lowerFirst, now) => {
  const timeMatch = lowerFirst.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!timeMatch) return null;
  const melbourneDate = getMelbourneDateParts(now);
  const calendarDate = new Date(Date.UTC(melbourneDate.year, melbourneDate.month - 1, melbourneDate.day));
  if (/\btomorrow\b/i.test(lowerFirst)) calendarDate.setUTCDate(calendarDate.getUTCDate() + 1);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] || 0);
  const ampm = timeMatch[3].toLowerCase();
  if (ampm === 'pm' && hour !== 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  return melbourneWallTimeToDate({
    year: calendarDate.getUTCFullYear(),
    month: calendarDate.getUTCMonth() + 1,
    day: calendarDate.getUTCDate(),
    hour,
    minute,
  });
};

module.exports = {
  extractAustralianPhone,
  parseBookingProposal,
  parseDriverDetails,
  parseJobId,
};
