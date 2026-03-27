import { useEffect, useState } from 'react';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import { fetchAdmin, postAdmin } from '../lib/adminApi';
import { formatMelbourneDateTime } from '../../lib/time';

function RideStatusBadge({ status }) {
  const cls =
    status === 'completed'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'cancelled'
        ? 'bg-red-100 text-red-700'
        : 'bg-sky-100 text-sky-700';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{status || 'upcoming'}</span>;
}

export default function RideManagement() {
  const [filters, setFilters] = useState({ status: 'upcoming', assigned: '', search: '' });
  const [data, setData] = useState({ rides: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [assigningRideId, setAssigningRideId] = useState(null);
  const [regoInputs, setRegoInputs] = useState({});

  const loadRides = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const response = await fetchAdmin('/rides', nextFilters);
      setData({ rides: response.rides || [], total: response.total || 0 });
    } catch (error) {
      setData({ rides: [], total: 0 });
      setStatusMessage({ type: 'error', message: 'Failed to load rides.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides().catch(() => {});
  }, []);

  const handleFilterChange = async (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    await loadRides(next);
  };

  const handleAssign = async (rideId) => {
    const taxiReg = String(regoInputs[rideId] || '').trim().toUpperCase();
    if (!taxiReg) {
      setStatusMessage({ type: 'error', message: 'Enter a car rego before assigning.' });
      return;
    }

    setAssigningRideId(rideId);
    setStatusMessage(null);
    try {
      await postAdmin(`/rides/${rideId}/assign-by-rego`, { taxiReg });
      setStatusMessage({ type: 'success', message: `Ride #${rideId} assigned to ${taxiReg}.` });
      await loadRides();
    } catch (error) {
      setStatusMessage({ type: 'error', message: error.response?.data?.error || 'Failed to assign ride.' });
    } finally {
      setAssigningRideId(null);
    }
  };

  const handleStatusUpdate = async (rideId, status) => {
    setStatusMessage(null);
    try {
      if (status === 'completed') {
        await postAdmin(`/rides/${rideId}/complete`, {});
      } else {
        await postAdmin(`/rides/${rideId}/status`, { status });
      }
      setStatusMessage({ type: 'success', message: `Ride #${rideId} marked ${status}.` });
      await loadRides();
    } catch (error) {
      setStatusMessage({ type: 'error', message: error.response?.data?.error || 'Failed to update ride status.' });
    }
  };

  return (
    <div>
      <AnalyticsPageHeader
        eyebrow="Ride Management"
        title="Assign jobs and close them out cleanly"
        description="Admins can search rides, assign them to an existing driver using car rego, and mark jobs completed or cancelled when they are handled outside the normal driver workflow."
      />

      <AnalyticsPanel title="Ride filters" description="Use these filters to narrow the booking queue before taking action.">
        <div className="grid gap-3 md:grid-cols-3">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.status} onChange={(e) => handleFilterChange({ status: e.target.value })}>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" value={filters.assigned} onChange={(e) => handleFilterChange({ assigned: e.target.value })}>
            <option value="">Assigned and unassigned</option>
            <option value="false">Unassigned only</option>
            <option value="true">Assigned only</option>
          </select>
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Search name, phone, pickup, dropoff, rego" value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} onBlur={() => handleFilterChange({ search: filters.search })} />
        </div>

        {statusMessage ? (
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {statusMessage.message}
          </div>
        ) : null}
      </AnalyticsPanel>

      <AnalyticsPanel title="Ride queue" description={`${data.total} rides matched the current filters.`} className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading rides...</p>
        ) : (
          <div className="space-y-4">
            {data.rides.map((ride) => (
              <div key={ride.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">Ride #{ride.id}</p>
                      <RideStatusBadge status={ride.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{formatMelbourneDateTime(ride.rideDate)}</p>
                    <p className="mt-2 text-sm text-slate-900"><span className="font-semibold">Passenger:</span> {ride.name} · {ride.phone}</p>
                    <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Route:</span> {ride.pickup} to {ride.dropoff}</p>
                    <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Vehicle:</span> {ride.vehicleType} · ${Number(ride.fare || 0).toFixed(2)}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      <span className="font-semibold">Assigned driver:</span>{' '}
                      {ride.driver ? `${ride.driver.name} (${ride.driver.taxiReg})` : 'Not assigned'}
                    </p>
                  </div>

                  <div className="w-full max-w-md space-y-3">
                    <div className="rounded-2xl border border-white bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assign by car rego</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder="ABC123"
                          value={regoInputs[ride.id] || ''}
                          onChange={(e) => setRegoInputs((current) => ({ ...current, [ride.id]: e.target.value.toUpperCase() }))}
                        />
                        <button
                          onClick={() => handleAssign(ride.id)}
                          disabled={assigningRideId === ride.id}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {assigningRideId === ride.id ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleStatusUpdate(ride.id, 'completed')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                        Mark completed
                      </button>
                      <button onClick={() => handleStatusUpdate(ride.id, 'cancelled')} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                        Mark cancelled
                      </button>
                      <button onClick={() => handleStatusUpdate(ride.id, 'upcoming')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                        Reset to upcoming
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!data.rides.length ? <p className="text-sm text-slate-500">No rides matched the current filters.</p> : null}
          </div>
        )}
      </AnalyticsPanel>
    </div>
  );
}
