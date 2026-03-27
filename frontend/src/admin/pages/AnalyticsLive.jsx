import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { RiskBadge, SourceBadge } from '../components/AnalyticsBadge';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';
import { sanitizeLandingValue } from '../lib/landingDisplay';
import { formatMelbourneTime } from '../../lib/time';

const formatTime = (value) => {
  try {
    return formatMelbourneTime(value);
  } catch {
    return '-';
  }
};

const formatRoute = (session) => {
  const pickup = session.pickupSuburb || 'Unknown pickup';
  const dropoff = session.dropoffSuburb || 'Unknown dropoff';
  return `${pickup} to ${dropoff}`;
};

const formatSessionNote = (session) => {
  const parts = [];

  if (session.deviceType || session.browser) {
    parts.push(`${session.deviceType || '-'} / ${session.browser || '-'}`);
  }

  parts.push(`${session.eventCount || 0} event${session.eventCount === 1 ? '' : 's'}`);
  return parts.join(' | ');
};

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

      <AnalyticsPanel title="Active session feed" description="Click a session card to inspect the detailed session trail." className="mt-6">
        {sessions.length ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
                className="group rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{formatTime(session.startedAt)}</p>
                    <p className="mt-2 font-mono text-xs text-slate-500">{String(session.sessionToken || '').slice(0, 12)}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <SourceBadge value={session.sourceType} />
                    <RiskBadge value={session.riskBand} />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Classification</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{session.sourceClassificationReason || 'No classification note'}</p>
                  <p className="mt-1 text-xs text-slate-500">Risk score {session.riskScore ?? 0}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Landing</p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-900">{sanitizeLandingValue(session.landingPath)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Route</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{formatRoute(session)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Latest</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{session.latestEventName || '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Melbourne</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{session.isLikelyMelbourne ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Paid click</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{session.hasGclid ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <p className="text-xs text-slate-500">{formatSessionNote(session)}</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 transition group-hover:text-sky-800">
                    Open details
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No active sessions match the current filters.
          </div>
        )}
      </AnalyticsPanel>

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
