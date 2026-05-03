const SITE_KEYS = {
  PRIME_CABS_MELBOURNE: 'prime_cabs_melbourne',
  LOCAL_TAXI_MELBOURNE: 'local_taxi_melbourne',
};

const SITE_LABELS = {
  [SITE_KEYS.PRIME_CABS_MELBOURNE]: 'Prime Cabs Melbourne',
  [SITE_KEYS.LOCAL_TAXI_MELBOURNE]: 'Local Taxi Melbourne',
};

const VALID_SITE_KEYS = new Set(Object.values(SITE_KEYS));

const normalizeSiteKey = (value, fallback = SITE_KEYS.PRIME_CABS_MELBOURNE) => {
  const candidate = String(value || '').trim().toLowerCase();
  return VALID_SITE_KEYS.has(candidate) ? candidate : fallback;
};

module.exports = {
  SITE_KEYS,
  SITE_LABELS,
  VALID_SITE_KEYS,
  normalizeSiteKey,
};
