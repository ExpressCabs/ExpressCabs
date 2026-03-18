const path = require('path');

const suburbsData = require(path.join(__dirname, '../../../frontend/src/data/melbourneSuburbs.json'));

const AIRPORT_PATTERNS = [
  /melbourne airport/i,
  /tullamarine/i,
  /terminal\s*[1-4]/i,
  /avalon airport/i,
];

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

const isLikelyMelbourne = ({
  geoCity,
  geoRegion,
  geoCountry,
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

  if (city.includes('melbourne')) return true;
  if (region.includes('vic')) return true;
  if (country && country !== 'au') return false;
  if (pickupSuburb && suburbMap.has(String(pickupSuburb).toLowerCase())) return true;
  if (dropoffSuburb && suburbMap.has(String(dropoffSuburb).toLowerCase())) return true;
  if (isAirportPickup || isAirportDropoff) return true;
  return pathValue.includes('melbourne') || pathValue.includes('airport');
};

module.exports = {
  isAirportText,
  isLikelyMelbourne,
  normalizeSuburb,
};
