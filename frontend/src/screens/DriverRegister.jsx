import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DriverRegister = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [isValid, setIsValid] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        dcNumber: '',
        taxiRegistration: '',
        carModel: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!token) {
            setIsValid(false);
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_BASE_URL}/api/drivers/check-invite?token=${token}`)
            .then((res) => {
                if (res.data.success) {
                    setIsValid(true);
                    setFormData((prev) => ({
                        ...prev,
                        email: res.data.email || '',
                    }));
                } else {
                    setIsValid(false);
                }
            })
            .catch(() => setIsValid(false));
    }, [token]);

    const validateFields = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^((\+61|0)[2-478])\d{8}$/;
        const dcRegex = /^DC\d{6}$/;
        const taxiRegex = /^(\d{4}(M|R|U|BS)|(M|R|U|BS)\d{4})$/i;
        const carModelRegex = /^[a-zA-Z ]+$/;

        if (!emailRegex.test(formData.email)) return 'Invalid email format';
        if (!phoneRegex.test(formData.phone)) return 'Invalid Australian phone number';
        if (!dcRegex.test(formData.dcNumber)) return 'DC number must be DCXXXXXX (DC followed by 6 digits)';
        if (!taxiRegex.test(formData.taxiRegistration)) return 'Taxi rego must match format like 7259M, R1967, U2970 or BS0256';
        if (!carModelRegex.test(formData.carModel)) return 'Car model must only contain letters and spaces';

        return null;
    };

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validateFields();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const response = await axios.post('/api/drivers/register', {
                ...formData,
                token,
            });

            if (response.data.success) {
                setSuccess('Driver registered successfully!');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError('Registration failed.');
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Something went wrong on the server.';
            setError(msg);
        }
    };

    if (isValid === null) return <p className="p-4">Checking token...</p>;
    if (!isValid) return <p className="p-4 text-red-600">Invalid or expired token.</p>;

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded mt-8">
            <h2 className="text-2xl font-bold mb-4">Driver Registration</h2>

            {error && <p className="text-red-600 mb-3">{error}</p>}
            {success && <p className="text-green-600 mb-3">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="tel"
                    name="phone"
                    placeholder="Phone (e.g. 0412345678)"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Create Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full border p-2 rounded"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
                    >
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
                <input
                    type="text"
                    name="dcNumber"
                    placeholder="DC Number (e.g. DC123456)"
                    value={formData.dcNumber}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="text"
                    name="taxiRegistration"
                    placeholder="Taxi Registration (e.g. 7258M, R1967)"
                    value={formData.taxiRegistration}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="text"
                    name="carModel"
                    placeholder="Car Model (e.g. Lexus ES300H or Toyota Kluger)"
                    value={formData.carModel}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
                >
                    Register
                </button>
            </form>
        </div>
    );
};

export default DriverRegister;
