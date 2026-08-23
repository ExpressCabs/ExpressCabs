import { useEffect, useMemo, useState } from 'react';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import { fetchAdmin, postAdmin } from '../lib/adminApi';
import { formatMelbourneDateTime } from '../../lib/time';

const stateActions = [
  ['MAIN_DISPATCHED', 'Mark Main Dispatched'],
  ['EXCESS_DISPATCHED', 'Mark Excess Dispatched'],
  ['LOCAL_DISPATCHED', 'Mark Local Dispatched'],
  ['DRIVER_SELECTED', 'Mark Driver Selected'],
  ['DETAILS_SENT', 'Mark Details Sent'],
  ['ETA_CONFIRMED', 'Mark ETA Confirmed'],
  ['COVERED', 'Mark Covered'],
  ['PICKED_UP', 'Mark Picked Up'],
  ['COMPLETED', 'Mark Completed'],
  ['NEEDS_REVIEW', 'Needs Review'],
];

function StatusBadge({ status }) {
  const tone = status === 'NEEDS_REVIEW'
    ? 'bg-amber-100 text-amber-800'
    : status === 'COMPLETED'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'CANCELLED'
        ? 'bg-red-100 text-red-800'
        : 'bg-sky-100 text-sky-800';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{value || 'Not specified'}</p>
    </div>
  );
}

export default function DispatchBoard() {
  const [jobs, setJobs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const selectedSummary = useMemo(
    () => jobs.find((job) => job.id === selectedId) || null,
    [jobs, selectedId]
  );

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await fetchAdmin('/dispatch/jobs');
      setJobs(response.jobs || []);
      setCalendar(response.calendar || null);
      setSelectedId((current) => current || response.jobs?.[0]?.id || null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load dispatch jobs.' });
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      return;
    }
    setDetailLoading(true);
    try {
      const response = await fetchAdmin(`/dispatch/jobs/${jobId}`);
      setSelectedJob(response.job);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load dispatch job details.' });
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadJobs().catch(() => {});
  }, []);

  useEffect(() => {
    loadDetail(selectedId).catch(() => {});
  }, [selectedId]);

  const handleSync = async () => {
    setBusyAction('sync');
    setMessage(null);
    try {
      const result = await postAdmin('/dispatch/sync', {});
      setMessage({
        type: 'success',
        text: result.enabled
          ? `Calendar sync complete: ${result.created} created, ${result.updated} updated.`
          : 'Calendar sync is disabled.',
      });
      await loadJobs();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Calendar sync failed.' });
    } finally {
      setBusyAction(null);
    }
  };

  const copyText = async (text, label) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: `${label} copied.` });
  };

  const handleStateAction = async (status) => {
    if (!selectedJob) return;
    setBusyAction(status);
    setMessage(null);
    try {
      const response = await postAdmin(`/dispatch/jobs/${selectedJob.id}/status`, { status });
      setSelectedJob(response.job);
      await loadJobs();
      setMessage({ type: 'success', text: `Dispatch job marked ${status}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'State update failed.' });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div>
      <AnalyticsPageHeader
        eyebrow="Dispatch"
        title="AI dispatch phase 1 review board"
        description="Review calendar-imported jobs, copy public and private dispatch text, and manually advance each job through the audited dispatch state machine."
      />

      <AnalyticsPanel
        title="Calendar sync"
        description={calendar?.enabled ? `Reading ${calendar.calendarId || 'primary'} calendar.` : 'Google Calendar polling is disabled until VPS credentials are configured.'}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-700">
            <span className="font-semibold">Upcoming jobs:</span> {jobs.length}
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={busyAction === 'sync'}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busyAction === 'sync' ? 'Syncing...' : 'Sync calendar now'}
          </button>
        </div>
        {message ? (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        ) : null}
      </AnalyticsPanel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
        <AnalyticsPanel title="Upcoming dispatch jobs" description="Select a job to review exact details and audit history.">
          {loading ? (
            <p className="text-sm text-slate-500">Loading dispatch jobs...</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedId(job.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === job.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">#{job.id} {job.pickupSuburb || 'Pickup TBC'} to {job.dropoffSuburb || 'Drop-off TBC'}</p>
                      <p className="mt-1 text-sm text-slate-600">{job.pickupAt ? formatMelbourneDateTime(job.pickupAt) : 'Time TBC'}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{job.source}</p>
                </button>
              ))}
              {!jobs.length ? <p className="text-sm text-slate-500">No upcoming dispatch jobs yet.</p> : null}
            </div>
          )}
        </AnalyticsPanel>

        <AnalyticsPanel
          title={selectedSummary ? `Dispatch job #${selectedSummary.id}` : 'Dispatch job detail'}
          description="Public text avoids street addresses. Private text includes exact driver details and the original calendar note."
        >
          {detailLoading ? (
            <p className="text-sm text-slate-500">Loading detail...</p>
          ) : selectedJob ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedJob.status} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{selectedJob.source}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {selectedJob.calendarSyncedAt ? `Synced ${formatMelbourneDateTime(selectedJob.calendarSyncedAt)}` : 'Not synced'}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Pickup time" value={selectedJob.pickupAt ? formatMelbourneDateTime(selectedJob.pickupAt) : null} />
                <DetailRow label="Title" value={selectedJob.title} />
                <DetailRow label="Pickup" value={selectedJob.pickup} />
                <DetailRow label="Drop-off" value={selectedJob.dropoff} />
                <DetailRow label="Passengers" value={selectedJob.passengerCount || selectedJob.passengerAssumption} />
                <DetailRow label="Luggage" value={selectedJob.luggage} />
                <DetailRow label="Vehicle requirement" value={selectedJob.vehicleRequirement} />
                <DetailRow label="Minimum fare" value={selectedJob.minimumFare ? `$${Number(selectedJob.minimumFare)}` : null} />
              </div>

              <DetailRow label="Original description" value={selectedJob.originalDescription} />

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900">Public dispatch text</p>
                    <button onClick={() => copyText(selectedJob.publicDispatchText, 'Public dispatch text')} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      Copy Public Dispatch
                    </button>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-slate-800">{selectedJob.publicDispatchText}</pre>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-900">Private driver details</p>
                    <button onClick={() => copyText(selectedJob.privateDriverText, 'Private driver details')} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      Copy Private Driver Details
                    </button>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm text-slate-800">{selectedJob.privateDriverText}</pre>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900">Manual state actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stateActions.map(([status, label]) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStateAction(status)}
                      disabled={busyAction === status}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busyAction === status ? 'Saving...' : label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900">Audit history</p>
                <div className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200">
                  {(selectedJob.auditEvents || []).map((event) => (
                    <div key={event.id} className="p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{event.eventType}</p>
                        <p className="text-slate-500">{formatMelbourneDateTime(event.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-slate-700">{event.actor}: {event.fromStatus || 'none'} to {event.toStatus || 'none'}</p>
                    </div>
                  ))}
                  {!selectedJob.auditEvents?.length ? <p className="p-4 text-sm text-slate-500">No audit events yet.</p> : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a dispatch job to review.</p>
          )}
        </AnalyticsPanel>
      </div>
    </div>
  );
}
