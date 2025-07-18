import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/login`, {
                email,
                password,
            });

            localStorage.setItem('admin', JSON.stringify(res.data.user));
            navigate('/admin/invite-driver');
        } catch (err) {
            console.error('Login error:', err);
            alert(err?.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white shadow p-6 rounded">
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
