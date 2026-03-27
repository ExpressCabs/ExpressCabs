import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import AnalyticsCard from '../components/AnalyticsCard';
import { RiskBadge, SourceBadge } from '../components/AnalyticsBadge';
import { AnalyticsInsightList, AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

const formatRiskReason = (value) => String(value || 'unknown').replaceAll('_', ' ');

const renderIpTable = (rows, title, description) => (
  <AnalyticsPanel title={title} description={description}>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4">IP Hash</th>
            <th className="pb-3 pr-4">Total</th>
            <th className="pb-3 pr-4">Paid</th>
            <th className="pb-3 pr-4">Suspicious</th>
            <th className="pb-3 pr-4">Primary Reason</th>
            <th className="pb-3 pr-4">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((row) => (
            <tr key={`${title}-${row.ipHash}`} className="border-b border-slate-100">
              <td className="py-3 pr-4 font-mono text-xs text-slate-600">{String(row.ipHash).slice(0, 16)}</td>
              <td className="py-3 pr-4">{row.totalSessions}</td>
              <td className="py-3 pr-4">{row.paidSessions}</td>
              <td className="py-3 pr-4">{row.suspiciousSessions}</td>
              <td className="py-3 pr-4 text-slate-600">{formatRiskReason(row.primaryReason)}</td>
              <td className="py-3 pr-4 text-slate-600">{new Date(row.lastSeen).toLocaleString()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="py-6 text-center text-slate-500">No matching IP patterns in this range.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AnalyticsPanel>
);

export default function AnalyticsTrafficQuality() {
  const [data, setData] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const nextData = await fetchAdminAnalytics('/traffic-quality', { range: 'today' });
      if (!cancelled) setData(nextData);
    };

    load().catch(() => {
      if (!cancelled) setData(null);
    });
    const timer = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const qualityInsights = data
    ? [
        {
          label: 'Highest immediate risk',
          value: `${data.blockCandidatesToday || 0} sessions are already block candidates today`,
          note: 'Treat this as the first queue for manual review or automated traffic filtering.',
          tone: data.blockCandidatesToday > 0 ? 'danger' : 'good',
        },
        {
          label: 'Pattern spread',
          value: `${data.repeatPaidIpHashes?.length || 0} repeat paid IP clusters and ${data.clickOnlyPatternSummary?.length || 0} click-only clusters detected`,
          note: 'These patterns help separate wasted paid traffic from normal repeat visitors.',
          tone: (data.repeatPaidIpHashes?.length || 0) + (data.clickOnlyPatternSummary?.length || 0) > 0 ? 'warn' : 'good',
        },
        {
          label: 'Bot-like activity',
          value: `${data.botLikeSessions || 0} sessions matched suspicious user-agent behavior`,
          note: 'Use this with session detail to confirm whether the traffic is junk or just unusual.',
          tone: data.botLikeSessions > 0 ? 'warn' : 'good',
        },
      ]
    : [];

  return (
    <div>
      <AnalyticsNav />

      <AnalyticsPageHeader
        eyebrow="Traffic Quality"
        title="Spot bad traffic before it distorts the story"
        description="This view groups suspicious sessions, repeat IP behavior, and click-only patterns so you can quickly decide what needs investigation and what can be ignored."
      >
        <AnalyticsInsightList items={qualityInsights} />
      </AnalyticsPageHeader>

      {data ? (
        <>
          <AnalyticsPanel title="Headline risk signals" description="A fast read on how noisy or risky today&apos;s traffic looks.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <AnalyticsCard label="Suspicious today" value={data.suspiciousSessionsToday} hint="Sessions already flagged as suspicious." tone="warn" />
              <AnalyticsCard label="Block candidates" value={data.blockCandidatesToday} hint="Highest risk band requiring attention." tone="danger" />
              <AnalyticsCard label="Repeat paid IPs" value={data.repeatPaidIpHashes?.length || 0} hint="Repeated paid traffic clusters." tone="warn" />
              <AnalyticsCard label="Click-only IPs" value={data.clickOnlyPatternSummary?.length || 0} hint="Traffic with click patterns but poor depth." tone="warn" />
              <AnalyticsCard label="Bot-like sessions" value={data.botLikeSessions} hint="Sessions with suspicious user-agent signals." tone="warn" />
            </div>
          </AnalyticsPanel>

          <AnalyticsPanel
            title="Suspicious sessions to inspect first"
            description="Open a session to review the source, route, event trail, and related block signals."
            className="mt-6"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4">Session</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Landing</th>
                    <th className="pb-3 pr-4">Latest</th>
                    <th className="pb-3 pr-4">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.suspiciousSessions?.length ? data.suspiciousSessions.map((session) => (
                    <tr key={session.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setSelectedSessionId(session.id)}>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">{String(session.sessionToken).slice(0, 12)}</td>
                      <td className="py-3 pr-4">
                        <div className="space-y-1">
                          <SourceBadge value={session.sourceType} />
                          <div className="text-xs text-slate-500">{session.sourceClassificationReason || 'No classification note'}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{session.landingPath || '-'}</td>
                      <td className="py-3 pr-4 text-slate-600">{session.latestEventName || '-'}</td>
                      <td className="py-3 pr-4"><RiskBadge value={session.riskBand} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">No suspicious sessions are currently listed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </AnalyticsPanel>

          <div className="mt-6 grid gap-6">
            {renderIpTable(
              data.repeatPaidIpHashes,
              'Repeat paid IP summary',
              'Repeated paid sessions are often the fastest way to spot waste or invalid traffic.'
            )}
            {renderIpTable(
              data.repeatedNoDepthIpSummary,
              'Repeated no-depth IP summary',
              'These visitors repeat but rarely move deeper into the booking flow.'
            )}
            {renderIpTable(
              data.clickOnlyPatternSummary,
              'Click-only pattern summary',
              'Useful for isolating visitors who trigger click events without meaningful booking progress.'
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Loading traffic quality...</p>
      )}

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
