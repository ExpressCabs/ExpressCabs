import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin/analytics', label: 'Overview', end: true },
  { to: '/admin/analytics/live', label: 'Live Traffic' },
  { to: '/admin/analytics/funnel', label: 'Funnel' },
  { to: '/admin/analytics/traffic-quality', label: 'Traffic Quality' },
  { to: '/admin/analytics/suburbs', label: 'Suburb Insights' },
  { to: '/admin/analytics/sessions', label: 'Session Explorer' },
  { to: '/admin/analytics/block-signals', label: 'Block Signals' },
];

export default function AnalyticsNav() {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Analytics Workspace</p>
          <p className="text-sm text-slate-500">Move from headline signals into live traffic, funnel, quality, and session detail.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
