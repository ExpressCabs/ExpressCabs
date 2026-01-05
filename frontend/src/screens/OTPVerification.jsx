import React, { useEffect, useRef, useState } from 'react';

const OTPVerification = ({ phone, onBack, onSuccess }) => {
    const [otp, setOtp] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const sentOnce = useRef(false);

    // ✅ SEND OTP
    const sendOtp = async () => {
        if (!phone) {
            setError('Missing phone number');
            return;
        }

        setSending(true);
        setError('');
        setInfo('');

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/otp/send`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setError(data?.error || 'Failed to send OTP');
                return;
            }

            setInfo(data?.message || 'OTP sent to your phone');
        } catch (err) {
            console.error('OTP send error:', err);
            setError('Failed to send OTP');
        } finally {
            setSending(false);
        }
    };

    // ✅ AUTO-SEND ON LOAD (IMPORTANT)
    useEffect(() => {
        if (sentOnce.current) return;
        sentOnce.current = true;
        sendOtp();
    }, []);

    // ✅ VERIFY OTP
    const handleVerify = async () => {
        if (!otp) {
            setError('Enter the OTP');
            return;
        }

        setVerifying(true);
        setError('');

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/otp/verify`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, otp }),
                }
            );

            const data = await res.json();

            if (res.ok && data.valid) {
                onSuccess(); // 👉 BOOK RIDE
            } else {
                setError(data?.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('OTP verification failed');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Verify your number</h2>
            <p className="text-sm text-gray-600 mb-4">
                OTP sent to <strong>{phone}</strong>
            </p>

            <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 border rounded mb-3"
                placeholder="Enter OTP"
            />

            {info && <p className="text-green-600 text-sm">{info}</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-black text-white py-2 rounded mt-3"
            >
                {verifying ? 'Verifying...' : 'Verify & Book'}
            </button>

            <button
                onClick={sendOtp}
                disabled={sending}
                className="w-full border py-2 rounded mt-2"
            >
                {sending ? 'Sending...' : 'Resend OTP'}
            </button>

            <button
                onClick={onBack}
                className="mt-4 text-sm underline"
            >
                ← Back
            </button>
        </div>
    );
};

export default OTPVerification;
