// src/components/UserLoginPopup.jsx
import React, { useState } from 'react';

const UserLoginPopup = ({ onLogin, onClose }) => {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');

    const handleLogin = () => {
        if (!phone || !name) {
            alert('Please enter name and phone');
            return;
        }

        const user = { name, phone };
        onLogin(user);
        onClose(); // close popup after login
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
                <h2 className="text-xl font-bold mb-4">Welcome to Express Cabs</h2>
                <p className="mb-3 text-sm text-gray-600">Log in to view past rides and driver info. Or continue as guest.</p>

                <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mb-2 p-2 border rounded"
                />
                <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mb-4 p-2 border rounded"
                />

                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Login
                </button>

                <button
                    onClick={onClose}
                    className="w-full mt-3 text-gray-600 underline text-sm"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
};

export default UserLoginPopup;
