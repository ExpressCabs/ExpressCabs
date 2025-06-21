// OTPVerification.jsx — Final version with proper error handling and onSuccess call
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4 text-center">Verify Your Number</h2>
                <p className="text-sm mb-2">Enter the 6-digit code sent to <strong>{phone}</strong></p>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-2 border rounded mb-3 focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                    placeholder="Enter OTP"
                />
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    {verifying ? 'Verifying...' : 'Verify & Book'}
                </button>
                <button
                    onClick={onBack}
                    className="mt-4 w-full text-sm text-gray-500 underline"
                >
                    ← Back
                </button>
            </div>
        </div>
    );
};

export default OTPVerification;
