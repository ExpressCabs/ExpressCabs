import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const DriverResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');

    const handleReset = async () => {
        try {
            const res = await axios.post(`/api/drivers/reset-password?token=${token}`, {
                newPassword,
            });
            setMessage(res.data.message || 'Password reset successful!');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error resetting password');
        }
    };

    if (!token) return <p className="text-center mt-10">Invalid or missing token.</p>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
            <h2 className="text-xl font-bold mb-4">Reset Driver Password</h2>

            <div className="relative mb-3">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border p-2 rounded pr-20"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2/3 -translate-y-1/2 text-sm text-blue-600"
                >
                    {showPassword ? 'Hide' : 'Show'}
                </button>
            </div>

            <button
                onClick={handleReset}
                className="w-full bg-blue-600 text-white py-2 rounded"
            >
                Reset Password
            </button>

            {message && <p className="mt-3 text-sm text-center">{message}</p>}
        </div>
    );
};

export default DriverResetPassword;
