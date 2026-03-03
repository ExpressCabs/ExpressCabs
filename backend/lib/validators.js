const normalizeAuPhone = (phone) => {
  const raw = String(phone || '').replace(/\s+/g, '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;
  return `+61${raw.replace(/^0/, '')}`;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

module.exports = {
  normalizeAuPhone,
  isNonEmptyString,
  parsePositiveInt,
};
