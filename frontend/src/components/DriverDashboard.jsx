import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DriverDashboard = ({ driver, onLogout }) => {
    console.log('🚨 DriverDashboard loaded');
    console.log('🔍 onLogout prop:', onLogout);

    const [tab, setTab] = useState('unassigned'); // 'unassigned' or 'myrides'
    const [unassignedRides, setUnassignedRides] = useState([]);
    const [myRides, setMyRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        if (tab === 'unassigned') {
            fetchUnassignedRides();
        } else if (tab === 'myrides') {
            fetchMyRides();
        }
    }, [tab]);

    const fetchUnassignedRides = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/rides/unassigned');
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
            const res = await axios.get(`http://localhost:3000/api/rides/assigned?driverId=${driver.id}`);
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
            const res = await axios.post(`http://localhost:3000/api/rides/${rideId}/assign`, {
                driverId: driver.id,
            });

            if (res.status === 200 || res.status === 204) {
                alert('✅ Ride assigned successfully!');
                // Remove it from unassigned rides immediately
                setUnassignedRides((prev) => prev.filter((r) => r.id !== rideId));
                // Optional: Refresh myRides if you're showing that tab
                if (tab === 'myrides') fetchMyRides();
            } else {
                alert('❌ Unexpected response from server');
                console.warn('Response was not OK:', res);
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
            const res = await axios.post(`http://localhost:3000/api/rides/${rideId}/unassign`, {
                driverId: driver.id,
            });

            if (res.status === 200) {
                alert('✅ Ride unassigned successfully!');
                // Remove from myRides
                setMyRides((prev) => prev.filter((r) => r.id !== rideId));
                // Optionally add back to unassignedRides
                fetchUnassignedRides();
            }
        } catch (err) {
            console.error('❌ Unassign error:', err);
            alert('❌ Could not unassign ride.');
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Welcome, {driver.name}</h2>
                <button onClick={() => {
                    console.log("logout clicked");
                    onLogout();
                }} className="text-sm text-red-600 underline">
                    Logout
                </button>

            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setTab('unassigned')}
                    className={`px-3 py-1 rounded ${tab === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Unassigned Rides
                </button>
                <button
                    onClick={() => setTab('myrides')}
                    className={`px-3 py-1 rounded ${tab === 'myrides' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
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
                    <ul className="space-y-4">
                        {unassignedRides.map((ride) => (
                            <li key={ride.id} className="p-4 border rounded shadow">
                                <p><strong>Pickup:</strong> {ride.pickup}</p>
                                <p><strong>Dropoff:</strong> {ride.dropoff}</p>
                                <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
                                <button
                                    onClick={() => handleAssign(ride.id)}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                    disabled={assigning === ride.id}
                                >
                                    {assigning === ride.id ? 'Assigning...' : 'Assign to Me'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )
            ) : (
                myRides.length === 0 ? (
                    <p>You have no assigned rides yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {myRides.map((ride) => (
                            <li key={ride.id} className="p-4 border rounded shadow bg-green-50">
                                <p><strong>Pickup:</strong> {ride.pickup}</p>
                                <p><strong>Dropoff:</strong> {ride.dropoff}</p>
                                <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
                                <button
                                    onClick={() => handleUnassign(ride.id)}
                                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                                >
                                    Unassign
                                </button>

                            </li>
                        ))}
                    </ul>
                )
            )}
        </div>
    );
};

export default DriverDashboard;
