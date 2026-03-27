import { useEffect, useState } from 'react';
import AnalyticsNav from '../components/AnalyticsNav';
import { fetchAdminAnalytics, postAdminAnalytics } from '../lib/analyticsApi';
import { formatMelbourneDateTime } from '../../lib/time';

export default function AnalyticsBlockSignals() {
  const [data, setData] = useState({ blockSignals: [], total: 0, page: 1, limit: 25 });

  const load = async () => {
    const next = await fetchAdminAnalytics('/block-signals', { page: data.page, limit: data.limit });
    setData(next);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const updateSignal = async (signal, patch) => {
    const path = patch.notes !== undefined ? `/block-signals/${signal.id}/note` : `/block-signals/${signal.id}/status`;
    await postAdminAnalytics(path, patch);
    await load();
  };

  return (
    <div>
      <AnalyticsNav />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Block Signals</h1>
          <p className="mt-1 text-sm text-slate-500">Analyst review of repeated suspicious IP patterns.</p>
        </div>
        <button onClick={() => load()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">IP Hash</th>
              <th className="pb-3 pr-4">Reason</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Counts</th>
              <th className="pb-3 pr-4">Seen</th>
              <th className="pb-3 pr-4">Notes</th>
              <th className="pb-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.blockSignals?.map((signal) => (
              <tr key={signal.id} className="border-b border-slate-100">
                <td className="py-3 pr-4">{signal.id}</td>
                <td className="py-3 pr-4 font-mono text-xs text-slate-600">{String(signal.ipHash).slice(0, 16)}</td>
                <td className="py-3 pr-4 text-slate-600">{signal.reason}</td>
                <td className="py-3 pr-4 text-slate-600">{signal.status}</td>
                <td className="py-3 pr-4 text-slate-600">{signal.sessionCount}/{signal.suspiciousSessionCount}/{signal.paidSessionCount}</td>
                <td className="py-3 pr-4 text-slate-600">{formatMelbourneDateTime(signal.lastSeenAt)}</td>
                <td className="py-3 pr-4 text-slate-600">{signal.notes || '—'}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateSignal(signal, { status: 'monitoring' })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Review</button>
                    <button onClick={() => updateSignal(signal, { status: 'ignored' })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Ignore</button>
                    <button onClick={() => updateSignal(signal, { status: 'open' })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Keep Open</button>
                    <button
                      onClick={() => {
                        const note = window.prompt('Add note', signal.notes || '');
                        if (note !== null) updateSignal(signal, { notes: note });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                    >
                      Add Note
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
