const sourceClasses = {
  google_paid: 'bg-blue-100 text-blue-700',
  google_organic: 'bg-emerald-100 text-emerald-700',
  direct: 'bg-slate-200 text-slate-700',
  referral_or_other: 'bg-stone-200 text-stone-700',
};

const riskClasses = {
  good: 'bg-emerald-100 text-emerald-700',
  watch: 'bg-amber-100 text-amber-700',
  suspicious: 'bg-orange-100 text-orange-700',
  block_candidate: 'bg-red-100 text-red-700',
};

const siteClasses = {
  prime_cabs_melbourne: 'bg-sky-100 text-sky-700',
  local_taxi_melbourne: 'bg-teal-100 text-teal-700',
};

export function SourceBadge({ value }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sourceClasses[value] || 'bg-slate-100 text-slate-700'}`}>
      {value || 'unknown'}
    </span>
  );
}

export function RiskBadge({ value }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskClasses[value] || 'bg-slate-100 text-slate-700'}`}>
      {value || 'unknown'}
    </span>
  );
}

export function SiteBadge({ value }) {
  const label =
    value === 'prime_cabs_melbourne'
      ? 'Prime Cabs'
      : value === 'local_taxi_melbourne'
      ? 'Local Taxi'
      : value || 'unknown';

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${siteClasses[value] || 'bg-slate-100 text-slate-700'}`}>
      {label}
    </span>
  );
}
