import React, { useState } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

const DriverForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSendReset = async () => {
        try {
            const res = await axios.post('/api/drivers/forgot-password', { email });
            setMessage(res.data.message || 'Reset link sent.');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error sending reset email.');
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Helmet>
                <title>Driver Password Reset | Prime Cabs Melbourne</title>
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href="https://www.primecabsmelbourne.com.au/" />
            </Helmet>
            <h2 className="text-xl font-bold mb-2">Driver Password Reset</h2>
            <input
                type="email"
                placeholder="Enter your driver email"
                className="w-full border p-2 mb-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button
                onClick={handleSendReset}
                className="w-full bg-blue-600 text-white p-2 rounded"
            >
                Send Reset Link
            </button>
            {message && <p className="mt-2 text-sm">{message}</p>}
        </div>
    );
};

export default DriverForgotPassword;
