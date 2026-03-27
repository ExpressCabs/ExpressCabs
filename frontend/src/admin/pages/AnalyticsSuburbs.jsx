import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

const SimpleList = ({ title, rows, nameKey = 'name', description }) => (
  <AnalyticsPanel title={title} description={description}>
    <div className="space-y-2">
      {rows?.map((row) => (
        <div key={`${title}-${row[nameKey] || row.route}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-700">{row[nameKey] || row.route}</span>
          <span className="font-semibold text-slate-900">{row.count}</span>
        </div>
      ))}
    </div>
  </AnalyticsPanel>
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
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [airportOnly]);

  return (
    <div>
      <AnalyticsNav />

      <AnalyticsPageHeader
        eyebrow="Suburb Insights"
        title="See demand patterns by area and route"
        description="This view makes it easier to spot where bookings originate, where they end, and which suburb pairs are strongest."
        actions={(
          <select value={airportOnly} onChange={(event) => setAirportOnly(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
            <option value="false">All suburb events</option>
            <option value="true">Airport-focused only</option>
          </select>
        )}
      />

      {data ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SimpleList title="Top pickup suburbs" rows={data.topPickupSuburbs} description="Use this to identify where demand starts most often." />
          <SimpleList title="Top dropoff suburbs" rows={data.topDropoffSuburbs} description="Helpful for understanding where rides are ending." />
          <SimpleList title="Top route pairs" rows={data.topRoutePairs} nameKey="route" description="Strong route pairs can guide landing pages and offer focus." />
          <SimpleList title="Paid traffic by suburb" rows={data.paidTrafficBySuburb} description="Shows which suburbs attract the most paid demand." />
          <SimpleList title="Suspicious traffic by suburb" rows={data.suspiciousTrafficBySuburb} description="Useful for checking whether bad traffic clusters around specific areas." />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Loading suburb insights...</p>
      )}
    </div>
  );
}
