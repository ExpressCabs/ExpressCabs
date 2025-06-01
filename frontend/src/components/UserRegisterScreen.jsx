// src/components/UserRegisterScreen.jsx
import React, { useState } from 'react';

const UserRegisterScreen = ({ onBackToLogin }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRegister = async () => {
        if (!name || !phone || !password) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.message || 'Registration failed');
                return;
            }

            setSuccess(true);
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong');
        }
    };

    if (success) {
        return (
            <div className="max-w-sm mx-auto bg-white p-6 rounded shadow text-center">
                <h2 className="text-xl font-bold mb-2">🎉 Registration Successful!</h2>
                <p className="mb-4 text-sm text-gray-700">You can now log in to track your rides.</p>
                <button
                    onClick={onBackToLogin}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-sm mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Register</h2>

            <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
            />

            <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mb-3 p-2 border rounded"
            />

            <input
                type="email"
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onClick={handleRegister}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
                Register
            </button>

            <p className="mt-4 text-sm text-center">
                Already have an account?{' '}
                <button onClick={onBackToLogin} className="text-blue-600 underline">
                    Login
                </button>
            </p>
        </div>
    );
};

export default UserRegisterScreen;
