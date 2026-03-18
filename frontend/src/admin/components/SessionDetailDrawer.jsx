import { useEffect, useState } from 'react';
import { fetchAdminAnalytics } from '../lib/analyticsApi';
import { RiskBadge, SourceBadge } from './AnalyticsBadge';

export default function SessionDetailDrawer({ sessionId, onClose }) {
  const [state, setState] = useState({ loading: false, detail: null, error: '' });

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const load = async () => {
      setState({ loading: true, detail: null, error: '' });
      try {
        const detail = await fetchAdminAnalytics(`/session/${sessionId}`);
        if (!cancelled) {
          setState({ loading: false, detail, error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, detail: null, error: 'Failed to load session detail.' });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) return null;

  const session = state.detail?.session;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/35">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Session Detail</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Session #{sessionId}</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Close
          </button>
        </div>

        {state.loading ? <p className="mt-6 text-sm text-slate-500">Loading session detail...</p> : null}
        {state.error ? <p className="mt-6 text-sm text-red-600">{state.error}</p> : null}

        {session ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Session metadata</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div><span className="font-semibold text-slate-800">Token:</span> {session.sessionToken}</div>
                  <div><span className="font-semibold text-slate-800">Visitor:</span> {state.detail?.visitor?.id || session.visitorId}</div>
                  <div><span className="font-semibold text-slate-800">Landing path:</span> {session.landingPath || '—'}</div>
                  <div><span className="font-semibold text-slate-800">Landing URL:</span> {session.landingUrl || '—'}</div>
                  <div><span className="font-semibold text-slate-800">Referrer:</span> {session.referrer || '—'}</div>
                  <div><span className="font-semibold text-slate-800">Device:</span> {session.deviceType || '—'} / {session.browser || '—'}</div>
                  <div><span className="font-semibold text-slate-800">User agent:</span> {session.userAgent || '—'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Classification and risk</p>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><SourceBadge value={session.sourceType} /><span>{session.sourceClassificationReason || '—'}</span></div>
                  <div className="flex items-center gap-2"><RiskBadge value={session.riskBand} /><span>Score {session.riskScore}</span></div>
                  <div><span className="font-semibold text-slate-800">GCLID:</span> {session.gclid || '—'}</div>
                  <div><span className="font-semibold text-slate-800">GBRAID:</span> {session.gbraid || '—'}</div>
                  <div><span className="font-semibold text-slate-800">WBRAID:</span> {session.wbraid || '—'}</div>
                  <div><span className="font-semibold text-slate-800">Melbourne:</span> {session.isLikelyMelbourne ? 'Yes' : 'No'}</div>
                  <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(session.melbourneClassificationReason || {}, null, 2)}</pre>
                  <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(session.riskReasonDetailsJson || session.riskReasonsJson || [], null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Event timeline</p>
              <div className="mt-4 space-y-3">
                {state.detail?.events?.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{event.eventName}</span>
                      <span>{new Date(event.eventTime).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 grid gap-1 md:grid-cols-2">
                      <div>Step: {event.stepName || '—'}</div>
                      <div>Pickup: {event.pickupSuburb || '—'}</div>
                      <div>Dropoff: {event.dropoffSuburb || '—'}</div>
                      <div>Vehicle: {event.vehicleType || '—'}</div>
                      <div>Fare: {event.estimatedFare ?? '—'}</div>
                      <div>Click: {event.clickTarget || event.clickLocation || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {state.detail?.relatedBlockSignals?.length ? (
              <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Related block signals</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {state.detail.relatedBlockSignals.map((signal) => (
                    <div key={signal.id} className="rounded-xl bg-slate-50 p-3">
                      #{signal.id} · {signal.reason} · {signal.status}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
