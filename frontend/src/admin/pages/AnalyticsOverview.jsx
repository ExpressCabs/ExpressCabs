import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import AnalyticsCard from '../components/AnalyticsCard';
import { RiskBadge, SourceBadge } from '../components/AnalyticsBadge';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

const initialState = { loading: true, data: null, error: '' };

export default function AnalyticsOverview() {
  const [range, setRange] = useState('today');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchAdminAnalytics('/overview', { range });
        if (!cancelled) setState({ loading: false, data, error: '' });
      } catch (error) {
        if (!cancelled) setState({ loading: false, data: null, error: 'Failed to load overview.' });
      }
    };

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [range]);

  const data = state.data;

  return (
    <div>
      <AnalyticsNav />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Analytics Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Traffic quality, source mix, and recent sessions.</p>
        </div>
        <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="today">Today</option>
          <option value="24h">24h</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>
      </div>

      {state.error ? <p className="mb-4 text-sm text-red-600">{state.error}</p> : null}
      {state.loading && !data ? <p className="text-sm text-slate-500">Loading overview…</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AnalyticsCard label="Active Sessions" value={data.activeSessions} />
            <AnalyticsCard label="Sessions" value={data.sessionsToday} />
            <AnalyticsCard label="Google Paid" value={data.googlePaid} />
            <AnalyticsCard label="Google Organic" value={data.googleOrganic} />
            <AnalyticsCard label="Direct" value={data.direct} />
            <AnalyticsCard label="Booking Started" value={data.bookingStarted} />
            <AnalyticsCard label="Fare Calculated" value={data.fareCalculated} />
            <AnalyticsCard label="Booking Success" value={data.bookingSuccess} />
            <AnalyticsCard label="Tel Clicks" value={data.telClicks} />
            <AnalyticsCard label="WhatsApp Clicks" value={data.whatsappClicks} />
            <AnalyticsCard label="Suspicious" value={data.suspiciousSessions} />
            <AnalyticsCard label="Block Candidates" value={data.blockCandidateSessions} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Source Mix</h2>
              <div className="mt-4 space-y-3">
                {data.sourceBreakdown?.map((item) => (
                  <div key={item.sourceType}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <SourceBadge value={item.sourceType} />
                      <span className="font-semibold text-slate-700">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${data.sessionsToday ? (item.count / data.sessionsToday) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Risk Band Distribution</h2>
              <div className="mt-4 space-y-3">
                {data.riskBandBreakdown?.map((item) => (
                  <div key={item.riskBand}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <RiskBadge value={item.riskBand} />
                      <span className="font-semibold text-slate-700">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${data.sessionsToday ? (item.count / data.sessionsToday) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Recent Sessions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4">Started</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Landing</th>
                    <th className="pb-3 pr-4">Latest Event</th>
                    <th className="pb-3 pr-4">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSessions?.map((session) => (
                    <tr key={session.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setSelectedSessionId(session.id)}>
                      <td className="py-3 pr-4">{new Date(session.startedAt).toLocaleString()}</td>
                      <td className="py-3 pr-4"><SourceBadge value={session.sourceType} /></td>
                      <td className="py-3 pr-4 text-slate-600">{session.landingPath || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{session.latestEventName || '—'}</td>
                      <td className="py-3 pr-4"><RiskBadge value={session.riskBand} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
