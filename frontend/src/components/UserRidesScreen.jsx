// UserRidesScreen.jsx — shows upcoming and past rides with driver details if assigned
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const UserRidesScreen = ({ user, onLogout, setMode }) => {
    const [rides, setRides] = useState([]);

    useEffect(() => {
        const fetchRides = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rides/user/${user.id}`);
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

    const RideCard = ({ ride }) => (
        <motion.li
            className="bg-white p-4 rounded-lg shadow border text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <p><strong>Name:</strong> {ride.name}</p>
            <p><strong>Phone:</strong> {ride.phone}</p>
            <p><strong>From:</strong> {ride.pickup}</p>
            <p><strong>To:</strong> {ride.dropoff}</p>
            <p><strong>Time:</strong> {new Date(ride.rideDate).toLocaleString()}</p>
            <p><strong>Fare:</strong> ${ride.fare?.toFixed(2)}</p>
            {ride.driver && (
                <div className="mt-2 text-blue-800">
                    <p><strong>Driver:</strong> {ride.driver.name}</p>
                    <p><strong>Phone:</strong> {ride.driver.phone}</p>
                    <p><strong>Vehicle:</strong> {ride.driver.carModel} ({ride.driver.taxiRegistration})</p>
                </div>
            )}
        </motion.li>
    );

    return (
        <motion.div
            className="max-w-2xl mx-auto min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6 rounded-xl shadow relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Helmet>
                <title>My Rides | Express Cabs Melbourne</title>
                <meta name="description" content="View and manage your upcoming and past taxi rides with Express Cabs. Stay updated on your scheduled trips." />

            </Helmet>

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
                    <ul className="space-y-3">
                        {myRides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-sm">No upcoming rides.</div>
                )}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Past Rides</h3>
                {pastRides.length > 0 ? (
                    <ul className="space-y-3">
                        {pastRides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
                    </ul>
                ) : (
                    <div className="text-gray-500 text-sm">No past rides.</div>
                )}
            </div>
        </motion.div>
    );
};

export default UserRidesScreen;
