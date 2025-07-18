// src/components/UserLoginPopup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserLoginPopup = ({ onLogin, onClose }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!phone || !password) {
            setError('Please enter both phone and password');
            return;
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users/login`, { phone, password });
            if (res.data.user) {
                onLogin(res.data.user);
                onClose(); // Close popup on success
            } else {
                setError('Login failed. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
                >
                    ×
                </button>

                <h2 className="text-xl font-bold mb-4">User Login</h2>
                {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

                <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                />

                <div className="relative mb-4">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Login
                </button>

                <button
                    onClick={() => {
                        onClose();
                        navigate('/register');
                    }}
                    className="w-full mt-3 text-sm text-blue-600 underline"
                >
                    Don't have an account? Register
                </button>

                <button
                    onClick={() => {
                        onClose();
                        navigate('/user-forgot-password');
                    }}
                    className="w-full mt-2 text-sm text-blue-600 underline"
                >
                    Forgot Password?
                </button>


                <button
                    onClick={onClose}
                    className="w-full mt-2 text-gray-600 underline text-sm"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
};

export default UserLoginPopup;
