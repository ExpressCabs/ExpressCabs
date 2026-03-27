import { useEffect, useMemo, useState } from 'react';
import { AnalyticsPageHeader, AnalyticsPanel } from '../components/AnalyticsPageHeader';
import { fetchAdmin, postAdmin } from '../lib/adminApi';

const initialManualForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  dcNumber: '',
  taxiRegistration: '',
  carModel: '',
};

export default function InviteDriver() {
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [manualForm, setManualForm] = useState(initialManualForm);
  const [manualStatus, setManualStatus] = useState(null);
  const [manualLoading, setManualLoading] = useState(false);

  const [driverSearch, setDriverSearch] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);

  const loadDrivers = async (search = '') => {
    setDriversLoading(true);
    try {
      const data = await fetchAdmin('/drivers', { search });
      setDrivers(data.drivers || []);
    } catch (error) {
      setDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers().catch(() => {});
  }, []);

  const filteredDriverCount = useMemo(() => drivers.length, [drivers]);

  const handleInvite = async () => {
    setInviteStatus(null);

    if (!email || !email.includes('@')) {
      setInviteStatus({ type: 'error', message: 'Enter a valid email.' });
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/drivers/generate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setInviteStatus({ type: 'success', message: 'Invite email sent successfully.' });
        setEmail('');
      } else {
        setInviteStatus({ type: 'error', message: data.error || 'Failed to send invite.' });
      }
    } catch (error) {
      setInviteStatus({ type: 'error', message: 'Server error' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleManualCreate = async () => {
    setManualStatus(null);
    setManualLoading(true);
    try {
      const data = await postAdmin('/drivers', manualForm);
      if (data.success) {
        setManualStatus({ type: 'success', message: 'Driver created successfully.' });
        setManualForm(initialManualForm);
        await loadDrivers(driverSearch);
      } else {
        setManualStatus({ type: 'error', message: data.error || 'Failed to create driver.' });
      }
    } catch (error) {
      setManualStatus({ type: 'error', message: error.response?.data?.error || 'Failed to create driver.' });
    } finally {
      setManualLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setDriverSearch(value);
    await loadDrivers(value);
  };

  return (
    <div>
      <AnalyticsPageHeader
        eyebrow="Driver Management"
        title="Add drivers and keep the fleet searchable"
        description="Admins can still send invite links, but this page also supports manual driver creation and quick lookup by car rego, name, or contact details."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsPanel title="Invite a driver" description="Use this when the driver should finish their own registration from an email link.">
          <label className="block text-sm font-medium text-slate-700">Driver email</label>
          <input
            type="email"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="driver@example.com"
          />

          <button
            onClick={handleInvite}
            disabled={inviteLoading}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {inviteLoading ? 'Sending...' : 'Send invite'}
          </button>

          {inviteStatus ? (
            <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${inviteStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {inviteStatus.message}
            </div>
          ) : null}
        </AnalyticsPanel>

        <AnalyticsPanel title="Create driver manually" description="Use this when the admin already has the full driver details and wants the account available immediately.">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Full name" value={manualForm.name} onChange={(e) => setManualForm((current) => ({ ...current, name: e.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Email" value={manualForm.email} onChange={(e) => setManualForm((current) => ({ ...current, email: e.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Phone" value={manualForm.phone} onChange={(e) => setManualForm((current) => ({ ...current, phone: e.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Temporary password" type="password" value={manualForm.password} onChange={(e) => setManualForm((current) => ({ ...current, password: e.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="DC number" value={manualForm.dcNumber} onChange={(e) => setManualForm((current) => ({ ...current, dcNumber: e.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Taxi rego" value={manualForm.taxiRegistration} onChange={(e) => setManualForm((current) => ({ ...current, taxiRegistration: e.target.value.toUpperCase() }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" placeholder="Car model" value={manualForm.carModel} onChange={(e) => setManualForm((current) => ({ ...current, carModel: e.target.value }))} />
          </div>

          <button
            onClick={handleManualCreate}
            disabled={manualLoading}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {manualLoading ? 'Creating...' : 'Create driver'}
          </button>

          {manualStatus ? (
            <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${manualStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {manualStatus.message}
            </div>
          ) : null}
        </AnalyticsPanel>
      </div>

      <AnalyticsPanel title="Current drivers" description="Search by rego, name, email, phone, or DC number." className="mt-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:max-w-md"
            placeholder="Search drivers"
            value={driverSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <p className="text-sm text-slate-500">{driversLoading ? 'Loading drivers...' : `${filteredDriverCount} drivers found`}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Phone</th>
                <th className="pb-3 pr-4">DC</th>
                <th className="pb-3 pr-4">Car Rego</th>
                <th className="pb-3 pr-4">Car Model</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-semibold text-slate-900">{driver.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{driver.email}</td>
                  <td className="py-3 pr-4 text-slate-600">{driver.phone}</td>
                  <td className="py-3 pr-4 text-slate-600">{driver.dcNumber}</td>
                  <td className="py-3 pr-4 text-slate-600">{driver.taxiReg}</td>
                  <td className="py-3 pr-4 text-slate-600">{driver.carModel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalyticsPanel>
    </div>
  );
}
