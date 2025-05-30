// components/DriverLoginScreen.jsx
import React, { useState } from 'react';
import axios from 'axios';

const DriverLoginScreen = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await axios.post('http://localhost:3000/api/driver/login', {
                email,
                password,
            });

            if (res.data.driver) {
                onLogin(res.data.driver); // Pass driver data to parent
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Login failed.');
        }
    };

    return (
        <div className="max-w-sm mx-auto mt-8 p-4 border rounded shadow bg-white">
            <h2 className="text-xl font-bold mb-4">Driver Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full border p-2 rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1">Password</label>
                    <input
                        type="password"
                        className="w-full border p-2 rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Login
                </button>
            </form>
        </div>
    );
};

export default DriverLoginScreen;
