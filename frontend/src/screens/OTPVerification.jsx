import React, { useState } from 'react';

const OTPVerification = ({ phone, onBack, onSuccess }) => {
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        setVerifying(true);
        setError('');

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                onSuccess();
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            setError('Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Verify Your Number</h2>
            <p className="text-sm text-gray-700 text-center mb-4">
                Enter the 6-digit code sent to <strong className="text-black">{phone}</strong>
            </p>

            <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-black mb-3 focus:ring-2 focus:ring-blue-500"
                maxLength={6}
                placeholder="Enter OTP"
            />

            {error && <p className="text-sm text-red-600 mb-2 text-center">{error}</p>}

            <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
                {verifying ? 'Verifying...' : 'Verify & Book'}
            </button>

            <button
                onClick={onBack}
                className="mt-4 w-full text-sm text-gray-500 underline text-center"
            >
                ← Back
            </button>
        </>
    );
};

export default OTPVerification;
