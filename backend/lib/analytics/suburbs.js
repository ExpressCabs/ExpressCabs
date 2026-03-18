const path = require('path');

const suburbsData = require(path.join(__dirname, '../../../frontend/src/data/melbourneSuburbs.json'));

const AIRPORT_PATTERNS = [
  /melbourne airport/i,
  /tullamarine/i,
  /terminal\s*[1-4]/i,
  /avalon airport/i,
];

const MELBOURNE_INTENT_PATH_PATTERNS = [
  /melbourne/i,
  /airport/i,
  /airport-transfer\/melbourne/i,
  /airport-taxi-melbourne/i,
];

const MELBOURNE_TIMEZONES = new Set(['Australia/Sydney', 'Australia/Melbourne']);

const suburbMap = new Map();

for (const suburb of suburbsData) {
  if (suburb?.name) {
    suburbMap.set(suburb.name.toLowerCase(), suburb.name);
  }
}

const cleanToken = (value) =>
  String(value || '')
    .replace(/\b(vic|victoria|australia)\b/gi, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toTitleCase = (value) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const isAirportText = (value) => {
  const raw = String(value || '');
  return AIRPORT_PATTERNS.some((pattern) => pattern.test(raw));
};

const normalizeSuburb = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (isAirportText(raw)) {
    return 'Melbourne Airport';
  }

  const parts = raw.split(',').map((part) => cleanToken(part)).filter(Boolean);
  for (const part of parts) {
    const exactMatch = suburbMap.get(part.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }
  }

  const normalizedWhole = cleanToken(raw);
  if (suburbMap.has(normalizedWhole.toLowerCase())) {
    return suburbMap.get(normalizedWhole.toLowerCase());
  }

  for (const [key, label] of suburbMap.entries()) {
    if (normalizedWhole.toLowerCase().includes(key)) {
      return label;
    }
  }

  return parts[1] ? toTitleCase(parts[1]) : parts[0] ? toTitleCase(parts[0]) : null;
};

const getMelbourneClassification = ({
  geoCity,
  geoRegion,
  geoCountry,
  timezone,
  landingPath,
  pickupSuburb,
  dropoffSuburb,
  isAirportPickup,
  isAirportDropoff,
}) => {
  const city = String(geoCity || '').toLowerCase();
  const region = String(geoRegion || '').toLowerCase();
  const country = String(geoCountry || '').toLowerCase();
  const pathValue = String(landingPath || '').toLowerCase();
  const reasons = {
    melbourneByGeo: Boolean(city.includes('melbourne') || region.includes('vic') || region.includes('victoria')),
    melbourneByTimezone: MELBOURNE_TIMEZONES.has(String(timezone || '')),
    melbourneByLandingPage: MELBOURNE_INTENT_PATH_PATTERNS.some((pattern) => pattern.test(pathValue)),
    melbourneByRoute: Boolean(
      (pickupSuburb && suburbMap.has(String(pickupSuburb).toLowerCase())) ||
      (dropoffSuburb && suburbMap.has(String(dropoffSuburb).toLowerCase())) ||
      isAirportPickup ||
      isAirportDropoff
    ),
  };

  const isLikelyMelbourne = Object.values(reasons).some(Boolean) && (!country || country === 'au');

  return {
    isLikelyMelbourne,
    reasons,
  };
};

module.exports = {
  getMelbourneClassification,
  isAirportText,
  normalizeSuburb,
};
