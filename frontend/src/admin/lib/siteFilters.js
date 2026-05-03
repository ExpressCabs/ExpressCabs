export const SITE_OPTIONS = [
  { value: '', label: 'All sites' },
  { value: 'prime_cabs_melbourne', label: 'Prime Cabs Melbourne' },
  { value: 'local_taxi_melbourne', label: 'Local Taxi Melbourne' },
];

export const SITE_LABELS = {
  prime_cabs_melbourne: 'Prime Cabs Melbourne',
  local_taxi_melbourne: 'Local Taxi Melbourne',
};

export const getSiteLabel = (value) => SITE_LABELS[value] || value || 'Unknown site';
