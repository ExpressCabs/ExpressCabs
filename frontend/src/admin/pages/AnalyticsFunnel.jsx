import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
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
      <AnalyticsPageHeader
        eyebrow="Funnel"
        title="See where sessions lose momentum"
        description="Compare each booking stage by source so drop-off points are easier to spot and explain."
        actions={(
          <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
            <option value="today">Today</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
        )}
      />

      <div className="space-y-6">
        {funnel.map((group) => (
          <AnalyticsPanel
            key={group.sourceType}
            title={group.sourceType.replaceAll('_', ' ')}
            description="Read conversion and drop-off row by row to find the stage that needs attention."
          >
            <div className="overflow-x-auto">
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
          </AnalyticsPanel>
        ))}
      </div>
    </div>
  );
}
