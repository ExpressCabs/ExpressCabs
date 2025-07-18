// src/admin/pages/InviteDriver.jsx
import { useState } from 'react';
import axios from 'axios';

export default function InviteDriver() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInvite = async () => {
        setStatus(null);

        if (!email || !email.includes('@')) {
            setStatus({ type: 'error', message: 'Enter a valid email.' });
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/drivers/generate-invite', { email });
            if (res.data.success) {
                setStatus({ type: 'success', message: 'Invite email sent successfully.' });
                setEmail('');
            } else {
                setStatus({ type: 'error', message: res.data.error || 'Failed to send invite.' });
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Server error';
            setStatus({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded shadow mt-8">
            <h2 className="text-xl font-bold mb-4">Invite a Driver</h2>

            <label className="block mb-2 font-medium">Driver Email</label>
            <input
                type="email"
                className="w-full p-2 border rounded mb-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@example.com"
            />

            <button
                onClick={handleInvite}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
                {loading ? 'Sending...' : 'Send Invite'}
            </button>

            {status && (
                <div
                    className={`mt-4 p-3 rounded ${status.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                >
                    {status.message}
                </div>
            )}
        </div>
    );
}
