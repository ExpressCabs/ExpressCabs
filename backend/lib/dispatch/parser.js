const {
  DISPATCH_STATUSES,
  PASSENGER_ASSUMPTIONS,
  VEHICLE_REQUIREMENTS,
} = require('./constants');
const { parseFareInstruction, parsePaymentMethod } = require('./farePolicy');

const SUBURB_NORMALISATIONS = new Map([
  ['sth', 'South'],
  ['south', 'South'],
  ['nth', 'North'],
  ['north', 'North'],
  ['e', 'East'],
  ['east', 'East'],
  ['w', 'West'],
  ['west', 'West'],
]);

const titleCase = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .split(' ')
  .map((part) => {
    const lower = part.toLowerCase();
    return SUBURB_NORMALISATIONS.get(lower) || `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
  })
  .join(' ');

const getEventStartDate = (event) => {
  const raw = event?.start?.dateTime || event?.start?.date || event?.pickupAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const stripHtml = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .trim();

const splitRouteFromTitle = (title) => {
  const parts = String(title || '').split(/\s+-\s+/);
  if (parts.length < 2) return {};
  return {
    pickupSuburb: titleCase(parts[0]),
    dropoffSuburb: titleCase(parts.slice(1).join(' - ')),
  };
};

const extractStructuredLine = (description, label) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = description.match(new RegExp(`^\\s*${escaped}\\s*:\\s*(.+)$`, 'im'));
  return match ? match[1].trim() : null;
};

const extractRouteFromDescription = (description) => {
  const pickup = extractStructuredLine(description, 'Pickup');
  const dropoff = extractStructuredLine(description, 'Dropoff') || extractStructuredLine(description, 'Drop-off');
  if (pickup || dropoff) return { pickup, dropoff };

  const firstLine = description.split(/\r?\n/).find((line) => /\bto\b/i.test(line)) || description;
  const match = firstLine.match(/^(.+?)\s+\bto\b\s+(.+?)(?=\s+(?:meter|card|cash|receipt|inbox|mptp|eftpos|early)\b|$)/i);
  if (!match) return {};

  return {
    pickup: match[1].trim(),
    dropoff: match[2].trim(),
  };
};

const suburbFromAddress = (address, fallback) => {
  if (!address) return fallback || null;
  const cleaned = String(address).replace(/[,]/g, ' ').trim();
  const parts = cleaned.split(/\s+/);
  if (!parts.length) return fallback || null;

  const last = parts[parts.length - 1];
  const previous = parts[parts.length - 2];
  if (/^(sth|south|nth|north|east|west|e|w)$/i.test(last) && previous) {
    return titleCase(`${previous} ${last}`);
  }
  return titleCase(last);
};

const extractPassengerCount = (description) => {
  const structured = extractStructuredLine(description, 'Passengers') || extractStructuredLine(description, 'Passenger');
  if (structured && /^\d{1,2}\b/.test(structured)) return Number(structured.match(/^\d{1,2}/)[0]);
  const source = structured || description;
  const match = source.match(/\b(?:passengers?|pax)\s*:?\s*(\d{1,2})\b/i);
  return match ? Number(match[1]) : null;
};

const extractLuggage = (description) => {
  const structured = extractStructuredLine(description, 'Luggage');
  if (structured) return structured;
  const match = description.match(/\bluggage\s*:?\s*([^\n.]+)/i);
  return match ? match[1].trim() : null;
};

const extractMinimumFare = (description) => {
  const match = description.match(/\b(?:min(?:imum)?(?:\s*fare)?)\s*:?\s*\$?\s*(\d+(?:\.\d{1,2})?)\b/i);
  return match ? Number(match[1]) : null;
};

const extractVehicleRequirement = (description) => {
  if (/\bwheelchair\b/i.test(description)) return VEHICLE_REQUIREMENTS.WHEELCHAIR;
  if (/\bchild\s*seat\b/i.test(description)) return VEHICLE_REQUIREMENTS.CHILD_SEAT;
  if (/\bmaxi\b/i.test(description) && /\bsuv\b/i.test(description)) return VEHICLE_REQUIREMENTS.SUV_OR_MAXI;
  if (/\bmaxi\b/i.test(description)) return VEHICLE_REQUIREMENTS.MAXI;
  if (/\bsuv\b/i.test(description)) return VEHICLE_REQUIREMENTS.SUV;
  return VEHICLE_REQUIREMENTS.ANY_SUITABLE;
};

const extractSpecialNotes = (description) => description
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !/^(pickup|dropoff|drop-off|passengers?|luggage)\s*:/i.test(line))
  .filter((line) => /\b(card|cash|receipt|inbox|mptp|meter|early|eftpos)\b/i.test(line));

const parseCalendarBooking = (event = {}) => {
  const title = String(event.summary || event.title || '').trim();
  const originalDescription = stripHtml(event.description || '');
  const pickupAt = getEventStartDate(event);
  const titleRoute = splitRouteFromTitle(title);
  const descriptionRoute = extractRouteFromDescription(originalDescription);
  const pickup = descriptionRoute.pickup || null;
  const dropoff = descriptionRoute.dropoff || null;
  const pickupSuburb = suburbFromAddress(pickup, titleRoute.pickupSuburb);
  const dropoffSuburb = suburbFromAddress(dropoff, titleRoute.dropoffSuburb);
  const passengerCount = extractPassengerCount(originalDescription);
  const luggage = extractLuggage(originalDescription);
  const minimumFare = extractMinimumFare(originalDescription);
  const fare = parseFareInstruction(originalDescription);

  const needsReview = !pickup || !dropoff || !pickupAt;

  return {
    title,
    originalDescription,
    pickup,
    pickupSuburb,
    dropoff,
    dropoffSuburb,
    pickupAt,
    passengerCount,
    passengerAssumption: passengerCount ? null : PASSENGER_ASSUMPTIONS.UP_TO_4,
    luggage,
    vehicleRequirement: extractVehicleRequirement(originalDescription),
    minimumFare,
    fareType: fare.fareType,
    fareAmount: fare.fareAmount,
    paymentMethod: parsePaymentMethod(originalDescription),
    boa: /\bBOA\b/i.test(originalDescription),
    specialNotes: extractSpecialNotes(originalDescription),
    status: needsReview ? DISPATCH_STATUSES.NEEDS_REVIEW : DISPATCH_STATUSES.READY_FOR_DISPATCH,
    needsReview,
  };
};

module.exports = {
  parseCalendarBooking,
  titleCase,
};
