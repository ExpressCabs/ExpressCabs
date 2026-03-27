import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import AnalyticsCard from '../components/AnalyticsCard';
import { RiskBadge, SourceBadge } from '../components/AnalyticsBadge';
import { AnalyticsInsightList, AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';
import { sanitizeLandingValue } from '../lib/landingDisplay';

const initialState = { loading: true, data: null, error: '' };

const formatPercent = (value) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

const getRatio = (value, total) => (total > 0 ? (value / total) * 100 : 0);

const getTopItem = (items = []) => items.reduce((top, item) => (!top || item.count > top.count ? item : top), null);

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
  const totalSessions = data?.sessionsToday || 0;
  const sourceLeader = getTopItem(data?.sourceBreakdown);
  const riskLeader = getTopItem(data?.riskBandBreakdown);
  const bookingStartRate = getRatio(data?.bookingStarted || 0, totalSessions);
  const fareRate = getRatio(data?.fareCalculated || 0, data?.bookingStarted || 0);
  const bookingSuccessRate = getRatio(data?.bookingSuccess || 0, data?.bookingStarted || 0);
  const riskySessionRate = getRatio((data?.suspiciousSessions || 0) + (data?.blockCandidateSessions || 0), totalSessions);

  const overviewInsights = data
    ? [
        {
          label: 'Top acquisition source',
          value: sourceLeader ? `${sourceLeader.sourceType.replaceAll('_', ' ')} leads with ${sourceLeader.count} sessions` : 'No source data yet',
          note: sourceLeader ? `${formatPercent(getRatio(sourceLeader.count, totalSessions))} of all tracked sessions in this range.` : '',
          tone: 'good',
        },
        {
          label: 'Booking progression',
          value: `${formatPercent(bookingStartRate)} of sessions started a booking, and ${formatPercent(bookingSuccessRate)} of started bookings completed successfully`,
          note: `${formatPercent(fareRate)} of started bookings reached fare calculation.`,
          tone: bookingSuccessRate >= 35 ? 'good' : 'warn',
        },
        {
          label: 'Attention needed',
          value: riskLeader ? `${riskLeader.count} sessions sit in the ${riskLeader.riskBand.replaceAll('_', ' ')} band` : 'No risk data yet',
          note: `${formatPercent(riskySessionRate)} of all sessions are suspicious or block candidates.`,
          tone: riskySessionRate >= 20 ? 'danger' : 'warn',
        },
      ]
    : [];

  return (
    <div>
      <AnalyticsNav />

      <AnalyticsPageHeader
        eyebrow="Admin Analytics"
        title="Readable, decision-first overview"
        description="This screen turns the latest traffic into quick conclusions: where sessions came from, how far they moved toward booking, and whether quality issues are rising."
        actions={(
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="today">Today</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>
        )}
      >
        <AnalyticsInsightList items={overviewInsights} />
      </AnalyticsPageHeader>

      {state.error ? <p className="mb-4 text-sm text-red-600">{state.error}</p> : null}
      {state.loading && !data ? <p className="text-sm text-slate-500">Loading overview...</p> : null}

      {data ? (
        <>
          <div className="grid gap-6">
            <AnalyticsPanel title="Traffic at a glance" description="Start here for the headline volume and channel mix.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard label="Total sessions" value={totalSessions} hint="Tracked sessions in the selected range." tone="info" />
                <AnalyticsCard label="Active right now" value={data.activeSessions} hint="Sessions updated in the last 5 minutes." />
                <AnalyticsCard label="Paid search" value={data.googlePaid} hint={formatPercent(getRatio(data.googlePaid, totalSessions))} />
                <AnalyticsCard label="Organic search" value={data.googleOrganic} hint={formatPercent(getRatio(data.googleOrganic, totalSessions))} />
                <AnalyticsCard label="Direct" value={data.direct} hint={formatPercent(getRatio(data.direct, totalSessions))} />
                <AnalyticsCard label="Referral / other" value={data.referralOrOther} hint={formatPercent(getRatio(data.referralOrOther, totalSessions))} />
                <AnalyticsCard label="Tel clicks" value={data.telClicks} hint="Raw click events, not deduplicated sessions." />
                <AnalyticsCard label="WhatsApp clicks" value={data.whatsappClicks} hint="Raw click events, useful for intent checks." />
              </div>
            </AnalyticsPanel>

            <AnalyticsPanel title="Booking intent and conversion" description="These KPIs show how many visitors progressed from interest to submitted bookings.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard label="Booking started" value={data.bookingStarted} hint={`${formatPercent(bookingStartRate)} of all sessions`} tone="info" />
                <AnalyticsCard label="Fare calculated" value={data.fareCalculated} hint={`${formatPercent(fareRate)} of started bookings`} tone="info" />
                <AnalyticsCard label="Booking success" value={data.bookingSuccess} hint={`${formatPercent(bookingSuccessRate)} of started bookings`} tone="success" />
                <AnalyticsCard
                  label="Unfinished after start"
                  value={Math.max((data.bookingStarted || 0) - (data.bookingSuccess || 0), 0)}
                  hint="Started bookings that did not reach success in this range."
                  tone={bookingSuccessRate >= 35 ? 'default' : 'warn'}
                />
              </div>
            </AnalyticsPanel>

            <AnalyticsPanel title="Traffic quality" description="Keep an eye on the share of risky traffic before conclusions are driven by noisy sessions.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AnalyticsCard label="Suspicious" value={data.suspiciousSessions} hint={formatPercent(getRatio(data.suspiciousSessions, totalSessions))} tone="warn" />
                <AnalyticsCard label="Block candidates" value={data.blockCandidateSessions} hint={formatPercent(getRatio(data.blockCandidateSessions, totalSessions))} tone="danger" />
                <AnalyticsCard label="Risky sessions total" value={(data.suspiciousSessions || 0) + (data.blockCandidateSessions || 0)} hint={formatPercent(riskySessionRate)} tone={riskySessionRate >= 20 ? 'danger' : 'warn'} />
                <AnalyticsCard label="Good or watch" value={Math.max(totalSessions - ((data.suspiciousSessions || 0) + (data.blockCandidateSessions || 0)), 0)} hint="Sessions outside the top risk bands." />
              </div>
            </AnalyticsPanel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <AnalyticsPanel title="Source mix" description="A quick way to see which channels are dominating this range.">
              <div className="space-y-3">
                {data.sourceBreakdown?.map((item) => (
                  <div key={item.sourceType}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <SourceBadge value={item.sourceType} />
                      <span className="font-semibold text-slate-700">
                        {item.count} sessions · {formatPercent(getRatio(item.count, totalSessions))}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${getRatio(item.count, totalSessions)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </AnalyticsPanel>

            <AnalyticsPanel title="Risk band distribution" description="Use this to separate normal demand from patterns that need investigation.">
              <div className="space-y-3">
                {data.riskBandBreakdown?.map((item) => (
                  <div key={item.riskBand}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <RiskBadge value={item.riskBand} />
                      <span className="font-semibold text-slate-700">
                        {item.count} sessions · {formatPercent(getRatio(item.count, totalSessions))}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${getRatio(item.count, totalSessions)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </AnalyticsPanel>
          </div>

          <AnalyticsPanel
            title="Recent sessions"
            description="Click any session to inspect the full event trail when a metric needs explanation."
            className="mt-6"
          >
            <div className="overflow-x-auto">
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
                      <td className="py-3 pr-4 text-slate-600">{sanitizeLandingValue(session.landingPath)}</td>
                      <td className="py-3 pr-4 text-slate-600">{session.latestEventName || '-'}</td>
                      <td className="py-3 pr-4"><RiskBadge value={session.riskBand} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsPanel>
        </>
      ) : null}

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
