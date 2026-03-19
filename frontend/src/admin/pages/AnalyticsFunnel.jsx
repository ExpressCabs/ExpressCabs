import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

export default function AnalyticsFunnel() {
  const [range, setRange] = useState('today');
  const [funnel, setFunnel] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await fetchAdminAnalytics('/funnel', { range });
      if (!cancelled) setFunnel(data.funnel || []);
    };

    load().catch(() => {
      if (!cancelled) setFunnel([]);
    });
    const timer = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [range]);

  return (
    <div>
      <AnalyticsNav />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Funnel</h1>
          <p className="mt-1 text-sm text-slate-500">Session-based stage counts by source type.</p>
        </div>
        <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="today">Today</option>
          <option value="24h">24h</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>
      </div>

      <div className="space-y-6">
        {funnel.map((group) => (
          <section key={group.sourceType} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold capitalize text-slate-900">{group.sourceType.replaceAll('_', ' ')}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4">Stage</th>
                    <th className="pb-3 pr-4">Sessions</th>
                    <th className="pb-3 pr-4">Conversion %</th>
                    <th className="pb-3 pr-4">Drop-off %</th>
                  </tr>
                </thead>
                <tbody>
                  {group.stages.map((stage) => (
                    <tr key={stage.eventName} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-slate-700">{stage.eventName}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">{stage.sessionCount}</td>
                      <td className="py-3 pr-4 text-slate-600">{stage.conversionPct}%</td>
                      <td className="py-3 pr-4 text-slate-600">{stage.dropOffPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
