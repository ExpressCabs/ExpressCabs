const toneClasses = {
  default: 'border-slate-200 bg-white',
  info: 'border-sky-200 bg-sky-50/70',
  success: 'border-emerald-200 bg-emerald-50/70',
  warn: 'border-amber-200 bg-amber-50/70',
  danger: 'border-red-200 bg-red-50/70',
};

export default function AnalyticsCard({ label, value, hint, eyebrow, tone = 'default' }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone] || toneClasses.default}`}>
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p> : null}
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}
