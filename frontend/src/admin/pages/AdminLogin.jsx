import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';

const AdminLogin = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from?.pathname || '/admin/invite-driver';

    // If already logged in, redirect away from login page
    useEffect(() => {
        const existingAdmin = localStorage.getItem('admin');
        if (existingAdmin) {
            navigate(redirectTo, { replace: true });
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/login`, {
                email,
                password,
            });

            const admin = res.data.user;
            localStorage.setItem('admin', JSON.stringify(admin));

            if (onLogin) onLogin(admin); // 🔥 Immediately update in-memory state
            navigate(redirectTo, { replace: true });
        } catch (err) {
            console.error('Login error:', err);
            alert(err?.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white shadow p-6 rounded">
            <Helmet>
                <title>Admin Login | Prime Cabs Melbourne</title>
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href="https://www.primecabsmelbourne.com.au/" />
            </Helmet>
            <h2 className="text-xl font-bold mb-4">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="border p-2 w-full"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="border p-2 w-full"
                    required
                />
                <button className="bg-blue-600 text-white px-4 py-2 w-full rounded">
                    Login
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;
