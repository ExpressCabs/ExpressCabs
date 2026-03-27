import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { RiskBadge, SourceBadge } from '../components/AnalyticsBadge';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

export default function AnalyticsLive() {
  const [filters, setFilters] = useState({ sourceType: '', riskBand: '', isLikelyMelbourne: '', paidOnly: '' });
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchAdminAnalytics('/live-sessions', {
          limit: 50,
          ...filters,
        });
        if (!cancelled) setSessions(data.sessions || []);
      } catch (error) {
        if (!cancelled) setSessions([]);
      }
    };

    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [filters]);

  return (
    <div>
      <AnalyticsNav />

      <AnalyticsPageHeader
        eyebrow="Live Traffic"
        title="Watch active sessions in real time"
        description="The feed refreshes every 3 seconds so you can quickly confirm where active users are coming from and whether they look healthy."
      />

      <AnalyticsPanel title="Live filters" description="Narrow the stream to the traffic segment you want to inspect first.">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.sourceType} onChange={(event) => setFilters((current) => ({ ...current, sourceType: event.target.value }))}>
            <option value="">All sources</option>
            <option value="google_paid">Google Paid</option>
            <option value="google_organic">Google Organic</option>
            <option value="direct">Direct</option>
            <option value="referral_or_other">Referral / Other</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.riskBand} onChange={(event) => setFilters((current) => ({ ...current, riskBand: event.target.value }))}>
            <option value="">All risk bands</option>
            <option value="good">Good</option>
            <option value="watch">Watch</option>
            <option value="suspicious">Suspicious</option>
            <option value="block_candidate">Block Candidate</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.isLikelyMelbourne} onChange={(event) => setFilters((current) => ({ ...current, isLikelyMelbourne: event.target.value }))}>
            <option value="">All traffic</option>
            <option value="true">Melbourne only</option>
            <option value="false">Non-Melbourne only</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.paidOnly} onChange={(event) => setFilters((current) => ({ ...current, paidOnly: event.target.value }))}>
            <option value="">All sessions</option>
            <option value="true">Paid only</option>
          </select>
        </div>
      </AnalyticsPanel>

      <AnalyticsPanel title="Active session feed" description="Click a row to inspect the detailed session trail." className="mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Started</th>
                <th className="pb-3 pr-4">Session</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3 pr-4">Device</th>
                <th className="pb-3 pr-4">Landing</th>
                <th className="pb-3 pr-4">Route</th>
                <th className="pb-3 pr-4">Events</th>
                <th className="pb-3 pr-4">Latest</th>
                <th className="pb-3 pr-4">Melbourne</th>
                <th className="pb-3 pr-4">GCLID</th>
                <th className="pb-3 pr-4">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setSelectedSessionId(session.id)}>
                  <td className="py-3 pr-4">{new Date(session.startedAt).toLocaleTimeString()}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">{String(session.sessionToken || '').slice(0, 12)}</td>
                  <td className="py-3 pr-4">
                    <div className="space-y-1">
                      <SourceBadge value={session.sourceType} />
                      <div className="text-xs text-slate-500">{session.sourceClassificationReason || 'No classification note'}</div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{session.deviceType || '-'} / {session.browser || '-'}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.landingPath || '-'}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.pickupSuburb || '-'} to {session.dropoffSuburb || '-'}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.eventCount}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.latestEventName || '-'}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.isLikelyMelbourne ? 'Yes' : 'No'}</td>
                  <td className="py-3 pr-4 text-slate-600">{session.hasGclid ? 'Yes' : 'No'}</td>
                  <td className="py-3 pr-4">
                    <div className="space-y-1">
                      <RiskBadge value={session.riskBand} />
                      <div className="text-xs text-slate-500">{session.riskScore}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalyticsPanel>

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
