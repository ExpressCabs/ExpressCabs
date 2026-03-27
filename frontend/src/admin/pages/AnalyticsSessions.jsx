import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { RiskBadge, SourceBadge } from '../components/AnalyticsBadge';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';
import { sanitizeLandingValue } from '../lib/landingDisplay';

export default function AnalyticsSessions() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    range: '7d',
    sourceType: '',
    riskBand: '',
    suburb: '',
    eventName: '',
    paidOnly: '',
    isLikelyMelbourne: '',
    gclidPresent: '',
  });
  const [data, setData] = useState({ sessions: [], total: 0 });
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next = await fetchAdminAnalytics('/sessions', filters);
      if (!cancelled) setData(next);
    };

    load().catch(() => {
      if (!cancelled) setData({ sessions: [], total: 0 });
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div>
      <AnalyticsNav />

      <AnalyticsPageHeader
        eyebrow="Session Explorer"
        title="Search stored sessions with less guesswork"
        description="Use filters to isolate the traffic segment you care about, then open a session to understand exactly what happened."
      />

      <AnalyticsPanel title="Explorer filters" description="These filters are designed to narrow the data before you read the table.">
        <div className="grid gap-3 md:grid-cols-5">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.range} onChange={(event) => setFilters((current) => ({ ...current, page: 1, range: event.target.value }))}>
            <option value="today">Today</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.sourceType} onChange={(event) => setFilters((current) => ({ ...current, page: 1, sourceType: event.target.value }))}>
            <option value="">All sources</option>
            <option value="google_paid">Google Paid</option>
            <option value="google_organic">Google Organic</option>
            <option value="direct">Direct</option>
            <option value="referral_or_other">Referral / Other</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.riskBand} onChange={(event) => setFilters((current) => ({ ...current, page: 1, riskBand: event.target.value }))}>
            <option value="">All risk bands</option>
            <option value="good">Good</option>
            <option value="watch">Watch</option>
            <option value="suspicious">Suspicious</option>
            <option value="block_candidate">Block Candidate</option>
          </select>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Suburb filter" value={filters.suburb} onChange={(event) => setFilters((current) => ({ ...current, page: 1, suburb: event.target.value }))} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.eventName} onChange={(event) => setFilters((current) => ({ ...current, page: 1, eventName: event.target.value }))}>
            <option value="">Any event</option>
            <option value="booking_started">booking_started</option>
            <option value="pickup_entered">pickup_entered</option>
            <option value="dropoff_entered">dropoff_entered</option>
            <option value="fare_calculated">fare_calculated</option>
            <option value="vehicle_selected">vehicle_selected</option>
            <option value="booking_submit_attempt">booking_submit_attempt</option>
            <option value="booking_submit_success">booking_submit_success</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={filters.paidOnly === 'true'} onChange={(event) => setFilters((current) => ({ ...current, page: 1, paidOnly: event.target.checked ? 'true' : '' }))} />
            Paid only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={filters.isLikelyMelbourne === 'true'} onChange={(event) => setFilters((current) => ({ ...current, page: 1, isLikelyMelbourne: event.target.checked ? 'true' : '' }))} />
            Melbourne only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={filters.gclidPresent === 'true'} onChange={(event) => setFilters((current) => ({ ...current, page: 1, gclidPresent: event.target.checked ? 'true' : '' }))} />
            GCLID only
          </label>
          <button onClick={() => setFilters((current) => ({ ...current }))} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Refresh
          </button>
        </div>
      </AnalyticsPanel>

      <AnalyticsPanel title="Session results" description="Open a row when you need the full event trail, visitor details, and risk reasons." className="mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Started</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4">Landing</th>
                <th className="pb-3 pr-4">Route</th>
                <th className="pb-3 pr-4">Latest Event</th>
                <th className="pb-3 pr-4">Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions?.map((session) => (
                <tr key={session.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setSelectedSessionId(session.id)}>
                  <td className="py-3 pr-4">{new Date(session.startedAt).toLocaleString()}</td>
                  <td className="py-3 pr-4"><SourceBadge value={session.sourceType} /></td>
                  <td className="py-3 pr-4 text-slate-600">{sanitizeLandingValue(session.landingPath)}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.pickupSuburb || '-'} to {session.dropoffSuburb || '-'}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.latestEventName || '-'}</td>
                  <td className="py-3 pr-4"><RiskBadge value={session.riskBand} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>Total sessions: {data.total}</span>
          <div className="flex gap-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={(filters.page * filters.limit) >= data.total}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </AnalyticsPanel>

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
