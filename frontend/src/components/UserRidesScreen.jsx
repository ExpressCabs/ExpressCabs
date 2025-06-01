import React, { useEffect, useState } from 'react';

const UserRidesScreen = ({ user, onLogout, setMode }) => {
    const [rides, setRides] = useState([]);

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const res = await fetch(`/api/rides/user/${user.id}`);
                const data = await res.json();
                setRides(data);
            } catch (error) {
                console.error('Error fetching user rides:', error);
            }
        };

        if (user?.id) {
            fetchRides();
        }
    }, [user]);

    const now = new Date();
    const myRides = [];
    const pastRides = [];

    rides.forEach((ride) => {
        const rideTime = new Date(ride.rideDate);
        const minutesFromNow = (rideTime - now) / 60000;

        if (ride.status === 'completed') {
            pastRides.push(ride);
        } else if (minutesFromNow >= -60) {
            myRides.push(ride);
        }
    });

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow relative">
            {/* Logout Button in Top Right */}
            <button
                onClick={() => {
                    onLogout();
                    setMode('passenger');
                }}
                className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
                🚪 Logout
            </button>

            <h2 className="text-2xl font-bold mb-4">📋 My Rides</h2>
            <p className="text-sm text-gray-500 mb-6">
                Welcome, {user?.name} ({user?.phone})
            </p>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">🚗 Upcoming Rides</h3>
                {myRides.length > 0 ? (
                    <ul className="list-disc ml-5 text-sm text-gray-700">
                        {myRides.map((ride) => (
                            <li key={ride.id}>
                                {ride.pickup} → {ride.dropoff} @{' '}
                                {new Date(ride.rideDate).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-sm">No upcoming rides.</div>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">📜 Past Rides</h3>
                {pastRides.length > 0 ? (
                    <ul className="list-disc ml-5 text-sm text-gray-700">
                        {pastRides.map((ride) => (
                            <li key={ride.id}>
                                {ride.pickup} → {ride.dropoff} @{' '}
                                {new Date(ride.rideDate).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-sm">No past rides.</div>
                )}
            </div>
        </div>
    );
};

export default UserRidesScreen;
