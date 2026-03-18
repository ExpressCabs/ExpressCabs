import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

const SimpleList = ({ title, rows, nameKey = 'name' }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <div className="mt-4 space-y-2">
      {rows?.map((row) => (
        <div key={`${title}-${row[nameKey] || row.route}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-700">{row[nameKey] || row.route}</span>
          <span className="font-semibold text-slate-900">{row.count}</span>
        </div>
      ))}
    </div>
  </section>
);

export default function AnalyticsSuburbs() {
  const [data, setData] = useState(null);
  const [airportOnly, setAirportOnly] = useState('false');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next = await fetchAdminAnalytics('/suburb-insights', {
        range: '7d',
        airportOnly,
      });
      if (!cancelled) setData(next);
    };

    load().catch(() => {
      if (!cancelled) setData(null);
    });
    const timer = window.setInterval(load, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [airportOnly]);

  return (
    <div>
      <AnalyticsNav />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Suburb Insights</h1>
          <p className="mt-1 text-sm text-slate-500">Melbourne pickup, dropoff, and airport-intent demand.</p>
        </div>
        <select value={airportOnly} onChange={(event) => setAirportOnly(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="false">All suburb events</option>
          <option value="true">Airport-focused only</option>
        </select>
      </div>

      {data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SimpleList title="Top Pickup Suburbs" rows={data.topPickupSuburbs} />
          <SimpleList title="Top Dropoff Suburbs" rows={data.topDropoffSuburbs} />
          <SimpleList title="Top Route Pairs" rows={data.topRoutePairs} nameKey="route" />
          <SimpleList title="Paid Traffic by Suburb" rows={data.paidTrafficBySuburb} />
          <SimpleList title="Suspicious Traffic by Suburb" rows={data.suspiciousTrafficBySuburb} />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Loading suburb insights…</p>
      )}
    </div>
  );
}
