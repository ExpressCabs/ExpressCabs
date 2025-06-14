import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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
        <motion.div
            className="max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6 rounded-xl shadow relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Logout Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    onLogout();
                    setMode('passenger');
                }}
                className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
                Logout
            </motion.button>

            <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">My Rides</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
                Welcome, <strong>{user?.name}</strong> ({user?.phone})
            </p>

            <div className="mb-8">
                <h3 className="text-lg font-semibold text-green-700 mb-2">Upcoming Rides</h3>
                {myRides.length > 0 ? (
                    <ul className="space-y-3 text-sm">
                        {myRides.map((ride) => (
                            <motion.li
                                key={ride.id}
                                className="bg-white p-4 rounded-lg shadow border"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p><strong>From:</strong> {ride.pickup}</p>
                                <p><strong>To:</strong> {ride.dropoff}</p>
                                <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
                            </motion.li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-sm">No upcoming rides.</div>
                )}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Past Rides</h3>
                {pastRides.length > 0 ? (
                    <ul className="space-y-3 text-sm">
                        {pastRides.map((ride) => (
                            <motion.li
                                key={ride.id}
                                className="bg-gray-100 p-4 rounded-lg shadow border"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p><strong>From:</strong> {ride.pickup}</p>
                                <p><strong>To:</strong> {ride.dropoff}</p>
                                <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
                            </motion.li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-sm">No past rides.</div>
                )}
            </div>
        </motion.div>
    );
};

export default UserRidesScreen;
