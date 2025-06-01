// src/components/UserLoginScreen.jsx
import React, { useState } from 'react';

const UserLoginScreen = ({ onLogin, onRegisterClick }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!phone || !password) {
            alert('Please enter both phone and password');
            return;
        }

        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Login failed');
                return;
            }

            onLogin(data.user); // from backend
        } catch (error) {
            console.error('Login error:', error);
            alert('Login request failed');
        }
    };

    return (
        <div className="max-w-sm mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">User Login</h2>
            <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-4 p-2 border rounded"
            />
            <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
                Login
            </button>
            <p className="mt-4 text-sm text-center">
                Don’t have an account?{' '}
                <button onClick={onRegisterClick} className="text-blue-600 underline">
                    Register
                </button>
            </p>
        </div>
    );
};

export default UserLoginScreen;
