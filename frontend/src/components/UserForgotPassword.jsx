import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

const UserForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');

    const sendOtp = async () => {
        try {
            const res = await axios.post('/api/users/forgot-password', { phone });
            setMessage(res.data.message || 'OTP sent');
            setStep(2);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error sending OTP');
        }
    };

    const verifyOtp = async () => {
        try {
            const res = await axios.post('/api/users/verify-otp', {
                phone,
                otp,
                newPassword,
            });
            setMessage(res.data.message || 'Password reset');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to reset password');
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Helmet>
                <title>User Password Reset | Prime Cabs Melbourne</title>
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href="https://www.primecabsmelbourne.com.au/" />
            </Helmet>
            <h2 className="text-xl font-bold mb-2">User Password Reset</h2>

            {step === 1 && (
                <>
                    <input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="w-full border p-2 mb-2"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button
                        onClick={sendOtp}
                        className="w-full bg-blue-600 text-white p-2 rounded"
                    >
                        Send OTP
                    </button>
                </>
            )}

            {step === 2 && (
                <>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        className="w-full border p-2 mb-2"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        className="w-full border p-2 mb-2"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                        onClick={verifyOtp}
                        className="w-full bg-green-600 text-white p-2 rounded"
                    >
                        Reset Password
                    </button>
                </>
            )}

            {message && <p className="mt-2 text-sm">{message}</p>}
        </div>
    );
};

export default UserForgotPassword;
