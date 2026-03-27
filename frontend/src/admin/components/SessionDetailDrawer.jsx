import { useEffect, useMemo, useState } from 'react';
import { fetchAdminAnalytics } from '../lib/analyticsApi';
import { sanitizeLandingValue } from '../lib/landingDisplay';
import { RiskBadge, SourceBadge } from './AnalyticsBadge';

const TIMELINE_EVENT_LABELS = {
  session_started: 'Session started',
  page_view: 'Page view',
  engaged_view: 'Engaged view',
  booking_started: 'Booking started',
  pickup_entered: 'Pickup entered',
  dropoff_entered: 'Dropoff entered',
  fare_calculated: 'Fare calculated',
  vehicle_selected: 'Vehicle selected',
  passenger_details_submitted: 'Passenger details submitted',
  booking_submit_attempt: 'Booking submitted',
  booking_submit_success: 'Booking success',
  booking_submit_error: 'Booking error',
  tel_click: 'Phone click',
  whatsapp_click: 'WhatsApp click',
  session_ended: 'Session ended',
};

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value || '-');
  }
};

const formatEventSummary = (event) => {
  const parts = [];

  if (event.pickupSuburb) {
    parts.push(`Pickup: ${event.pickupSuburb}`);
  }
  if (event.dropoffSuburb) {
    parts.push(`Dropoff: ${event.dropoffSuburb}`);
  }
  if (event.vehicleType) {
    parts.push(`Vehicle: ${event.vehicleType}`);
  }
  if (typeof event.estimatedFare === 'number') {
    parts.push(`Fare: $${event.estimatedFare.toFixed(2)}`);
  }
  if (event.stepName) {
    parts.push(`Step: ${event.stepName}`);
  }
  if (event.clickTarget || event.clickLocation) {
    parts.push(`Click: ${event.clickTarget || event.clickLocation}`);
  }

  return parts.join(' | ');
};

const buildEventSignature = (event) =>
  JSON.stringify({
    eventName: event.eventName || '',
    stepName: event.stepName || '',
    pickupSuburb: event.pickupSuburb || '',
    dropoffSuburb: event.dropoffSuburb || '',
    vehicleType: event.vehicleType || '',
    estimatedFare: typeof event.estimatedFare === 'number' ? Number(event.estimatedFare.toFixed(2)) : null,
    clickTarget: event.clickTarget || '',
    clickLocation: event.clickLocation || '',
  });

const buildCondensedTimeline = (events = []) => {
  const milestones = [];
  let lastSignature = null;

  for (const event of events) {
    const signature = buildEventSignature(event);

    if (signature === lastSignature) {
      continue;
    }

    milestones.push({
      id: event.id,
      eventName: event.eventName,
      label: TIMELINE_EVENT_LABELS[event.eventName] || event.eventName,
      eventTime: event.eventTime,
      summary: formatEventSummary(event),
    });

    lastSignature = signature;
  }

  return milestones;
};

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

  const session = state.detail?.session;
  const condensedTimeline = useMemo(() => buildCondensedTimeline(state.detail?.events || []), [state.detail?.events]);
  const cleanedLandingPath = useMemo(() => sanitizeLandingValue(session?.landingPath), [session?.landingPath]);

  if (!sessionId) return null;

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
                  <div><span className="font-semibold text-slate-800">Landing page:</span> {cleanedLandingPath}</div>
                  <div><span className="font-semibold text-slate-800">Referrer:</span> {session.referrer || '-'}</div>
                  <div><span className="font-semibold text-slate-800">Device:</span> {session.deviceType || '-'} / {session.browser || '-'}</div>
                  <div><span className="font-semibold text-slate-800">User agent:</span> {session.userAgent || '-'}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Classification and risk</p>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><SourceBadge value={session.sourceType} /><span>{session.sourceClassificationReason || '-'}</span></div>
                  <div className="flex items-center gap-2"><RiskBadge value={session.riskBand} /><span>Score {session.riskScore}</span></div>
                  <div><span className="font-semibold text-slate-800">GCLID:</span> {session.gclid || '-'}</div>
                  <div><span className="font-semibold text-slate-800">GBRAID:</span> {session.gbraid || '-'}</div>
                  <div><span className="font-semibold text-slate-800">WBRAID:</span> {session.wbraid || '-'}</div>
                  <div><span className="font-semibold text-slate-800">Melbourne:</span> {session.isLikelyMelbourne ? 'Yes' : 'No'}</div>
                  <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(session.melbourneClassificationReason || {}, null, 2)}</pre>
                  <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(session.riskReasonDetailsJson || session.riskReasonsJson || [], null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">Event timeline</p>
                <p className="text-xs text-slate-500">
                  Showing {condensedTimeline.length} milestone{condensedTimeline.length === 1 ? '' : 's'} from {state.detail?.events?.length || 0} raw events.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {condensedTimeline.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-semibold text-slate-900">{event.label}</span>
                      <span>{formatDateTime(event.eventTime)}</span>
                    </div>
                    {event.summary ? <div className="mt-2 text-slate-600">{event.summary}</div> : null}
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
