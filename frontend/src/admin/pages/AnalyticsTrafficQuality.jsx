import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import AnalyticsCard from '../components/AnalyticsCard';
import { RiskBadge } from '../components/AnalyticsBadge';
import SessionDetailDrawer from '../components/SessionDetailDrawer';
import { fetchAdminAnalytics } from '../lib/analyticsApi';

const renderIpTable = (rows, title) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <div className="mt-4 overflow-x-auto">
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
          {rows?.map((row) => (
            <tr key={`${title}-${row.ipHash}`} className="border-b border-slate-100">
              <td className="py-3 pr-4 font-mono text-xs text-slate-600">{String(row.ipHash).slice(0, 16)}</td>
              <td className="py-3 pr-4">{row.totalSessions}</td>
              <td className="py-3 pr-4">{row.paidSessions}</td>
              <td className="py-3 pr-4">{row.suspiciousSessions}</td>
              <td className="py-3 pr-4 text-slate-600">{row.primaryReason || '—'}</td>
              <td className="py-3 pr-4 text-slate-600">{new Date(row.lastSeen).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
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
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div>
      <AnalyticsNav />
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Traffic Quality</h1>
        <p className="mt-1 text-sm text-slate-500">Suspicious patterns, repeat paid IPs, and click-only behavior.</p>
      </div>

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <AnalyticsCard label="Suspicious Today" value={data.suspiciousSessionsToday} />
            <AnalyticsCard label="Block Candidates" value={data.blockCandidatesToday} />
            <AnalyticsCard label="Repeat Paid IPs" value={data.repeatPaidIpHashes?.length || 0} />
            <AnalyticsCard label="Click-Only IPs" value={data.clickOnlyPatternSummary?.length || 0} />
            <AnalyticsCard label="Bot-Like Sessions" value={data.botLikeSessions} />
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Suspicious Sessions</h2>
            <div className="mt-4 overflow-x-auto">
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
                  {data.suspiciousSessions?.map((session) => (
                    <tr key={session.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50" onClick={() => setSelectedSessionId(session.id)}>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-600">{String(session.sessionToken).slice(0, 12)}</td>
                      <td className="py-3 pr-4 text-slate-600">{session.sourceType}</td>
                      <td className="py-3 pr-4 text-slate-600">{session.landingPath}</td>
                      <td className="py-3 pr-4 text-slate-600">{session.latestEventName || '—'}</td>
                      <td className="py-3 pr-4"><RiskBadge value={session.riskBand} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6 space-y-6">
            {renderIpTable(data.repeatPaidIpHashes, 'Repeat Paid IP Summary')}
            {renderIpTable(data.repeatedNoDepthIpSummary, 'Repeated No-Depth IP Summary')}
            {renderIpTable(data.clickOnlyPatternSummary, 'Click-Only Pattern Summary')}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Loading traffic quality…</p>
      )}

      <SessionDetailDrawer sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
    </div>
  );
}
