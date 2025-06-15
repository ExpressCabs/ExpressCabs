import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DriverDashboard = ({ driver, onLogout }) => {
    const [tab, setTab] = useState('unassigned');
    const [unassignedRides, setUnassignedRides] = useState([]);
    const [myRides, setMyRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        if (tab === 'unassigned') fetchUnassignedRides();
        else if (tab === 'myrides') fetchMyRides();
    }, [tab]);

    const fetchUnassignedRides = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rides/unassigned`);
            setUnassignedRides(res.data);
        } catch (err) {
            console.error('Error fetching unassigned rides:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRides = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rides/assigned?driverId=${driver.id}`);
            setMyRides(res.data);
        } catch (err) {
            console.error('Error fetching assigned rides:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (rideId) => {
        setAssigning(rideId);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/rides/${rideId}/assign`, { driverId: driver.id });
            if (res.status === 200 || res.status === 204) {
                alert('✅ Ride assigned successfully!');
                setUnassignedRides(prev => prev.filter(r => r.id !== rideId));
                if (tab === 'myrides') fetchMyRides();
            } else {
                alert('❌ Unexpected response from server');
            }
        } catch (err) {
            console.error('❌ Assignment failed:', err);
            alert('❌ Failed to assign ride.');
        } finally {
            setAssigning(null);
        }
    };

    const handleUnassign = async (rideId) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/rides/${rideId}/unassign`, { driverId: driver.id });
            if (res.status === 200) {
                alert('✅ Ride unassigned successfully!');
                setMyRides(prev => prev.filter(r => r.id !== rideId));
                fetchUnassignedRides();
            }
        } catch (err) {
            console.error('❌ Unassign error:', err);
            alert('❌ Could not unassign ride.');
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">Welcome, {driver.name}</h2>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onLogout}
                    className="text-sm text-red-600 underline hover:text-red-800"
                >
                    Logout
                </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('unassigned')}
                    className={`px-4 py-2 rounded-full transition-all font-medium ${tab === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'}`}
                >
                    Unassigned Rides
                </button>
                <button
                    onClick={() => setTab('myrides')}
                    className={`px-4 py-2 rounded-full transition-all font-medium ${tab === 'myrides' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-300'}`}
                >
                    My Rides
                </button>
            </div>

            {/* Ride Lists */}
            {loading ? (
                <p>Loading rides...</p>
            ) : tab === 'unassigned' ? (
                unassignedRides.length === 0 ? (
                    <p>No available rides at the moment.</p>
                ) : (
                    <div className="space-y-4">
                        {unassignedRides.map((ride) => (
                            <motion.div
                                key={ride.id}
                                className="bg-white p-4 rounded-xl shadow-lg border"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p><strong>Pickup:</strong> {ride.pickup}</p>
                                <p><strong>Dropoff:</strong> {ride.dropoff}</p>
                                <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
                                <button
                                    onClick={() => handleAssign(ride.id)}
                                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    disabled={assigning === ride.id}
                                >
                                    {assigning === ride.id ? 'Assigning...' : 'Assign to Me'}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )
            ) : (
                myRides.length === 0 ? (
                    <p>You have no assigned rides yet.</p>
                ) : (
                    <div className="space-y-4">
                        {myRides.filter(r => r.status !== 'completed').map((ride) => (
                            <motion.div
                                key={ride.id}
                                className="bg-green-50 p-4 rounded-xl shadow border"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p><strong>Pickup:</strong> {ride.pickup}</p>
                                <p><strong>Dropoff:</strong> {ride.dropoff}</p>
                                <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleUnassign(ride.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                    >
                                        Unassign
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm("Mark this ride as completed?")) return;
                                            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rides/${ride.id}/complete`, { method: 'POST' });
                                            if (res.ok) {
                                                alert('✅ Ride marked as completed.');
                                                fetchMyRides();
                                            } else {
                                                const error = await res.json();
                                                alert('❌ ' + (error?.error || 'Failed to update.'));
                                            }
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                    >
                                        ✅ Complete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            )}
        </motion.div>
    );
};

export default DriverDashboard;
