export function AnalyticsPageHeader({ eyebrow = 'Analytics', title, description, actions = null, children = null }) {
  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#eef2ff_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function AnalyticsPanel({ title, description, action = null, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AnalyticsInsightList({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border px-4 py-3 ${
            item.tone === 'danger'
              ? 'border-red-200 bg-red-50'
              : item.tone === 'warn'
                ? 'border-amber-200 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
          {item.note ? <p className="mt-1 text-xs leading-5 text-slate-600">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

