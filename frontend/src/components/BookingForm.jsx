// AddressScreen.jsx – Unified layout: all booking steps share hero background and structure
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VehicleSelection from '../screens/VehicleSelection';
import PassengerDetails from '../screens/PassengerDetails';
import OTPVerification from '../screens/OTPVerification';
import { Helmet } from 'react-helmet-async';
import { MdCalendarToday } from 'react-icons/md';

const heroImages = ['/assets/images/prime_cabs_landscape.png', '...bs_landscape3.png', '/assets/images/prime_cabs_landscape4.png'];
const fleet = [
    { name: 'Sedan', seats: 4, image: '../..public/assets/vehicles/sedan-modern.png' },
    { name: 'Luxury', seats: 4, image: '../..public/assets/vehicles/luxury-modern.png' },
    { name: 'SUV', seats: 6, image: '../..public/assets/vehicles/suv-modern.png' },
    { name: 'Van', seats: 11, image: '../..public/assets/vehicles/van-modern.png' },
];

const BookingForm = ({ loggedInUser }) => {
    useEffect(() => {
        const fleetTimer = setInterval(() => {
            setFleetIndex((prev) => (prev + 1) % fleet.length);
        }, 5000);
        return () => clearInterval(fleetTimer);
    }, []);

    const navigate = useNavigate();
    const mapRef = useRef(null);

    const [pickupLoc, setPickupLoc] = useState(null);
    const [dropoffLoc, setDropoffLoc] = useState(null);
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropoffAddress, setDropoffAddress] = useState('');
    const directionsRenderer = useRef(null);
    const [bookingType, setBookingType] = useState('now');
    const [passengerCount, setPassengerCount] = useState('');
    const [scheduledDateTime, setScheduledDateTime] = useState('');
    const [showBookingOptions, setShowBookingOptions] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [fare, setFare] = useState(null);
    const [fareType, setFareType] = useState('');
    const [passengerDetails, setPassengerDetails] = useState(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [fleetIndex, setFleetIndex] = useState(0);

    // UI helpers (do not change booking logic)
    const isLater = bookingType === 'later';
    const canProceedToVehicles =
        !!pickupAddress &&
        !!dropoffAddress &&
        !!passengerCount &&
        (!isLater || !!scheduledDateTime);

    // (kept) your existing hero slideshow interval — only one (duplicate removed)
    useEffect(() => {
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (window.google && mapRef.current) {
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: -37.8136, lng: 144.9631 },
                zoom: 10,
                disableDefaultUI: true,
            });

            directionsRenderer.current = new window.google.maps.DirectionsRenderer({ map });

            // Autocomplete for pickup
            const pickupInput = document.getElementById('pickup');
            const pickupAuto = new window.google.maps.places.Autocomplete(pickupInput);
            pickupAuto.addListener('place_changed', () => {
                const place = pickupAuto.getPlace();
                if (!place.geometry) return;
                setPickupLoc(place.geometry.location);
                setPickupAddress(place.formatted_address);
            });

            // Autocomplete for dropoff
            const dropoffInput = document.getElementById('dropoff');
            const dropoffAuto = new window.google.maps.places.Autocomplete(dropoffInput);
            dropoffAuto.addListener('place_changed', () => {
                const place = dropoffAuto.getPlace();
                if (!place.geometry) return;
                setDropoffLoc(place.geometry.location);
                setDropoffAddress(place.formatted_address);
            });
        }
    }, []);

    useEffect(() => {
        if (pickupLoc && dropoffLoc && window.google && directionsRenderer.current) {
            const service = new window.google.maps.DirectionsService();
            service.route(
                {
                    origin: pickupLoc,
                    destination: dropoffLoc,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === 'OK') directionsRenderer.current.setDirections(result);
                }
            );
        }
    }, [pickupLoc, dropoffLoc]);

    const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';

    const handleBookRide = async () => {
        try {
            const rideDate = bookingType === 'later' ? new Date(scheduledDateTime) : new Date();

            const payload = {
                name: passengerDetails?.name,
                phone: passengerDetails?.phone,
                email: passengerDetails?.email,
                note: passengerDetails?.note,
                pickup: pickupAddress,
                pickupLat: pickupLoc?.lat?.() ?? null,
                pickupLng: pickupLoc?.lng?.() ?? null,
                dropoff: dropoffAddress,
                dropoffLat: dropoffLoc?.lat?.() ?? null,
                dropoffLng: dropoffLoc?.lng?.() ?? null,
                rideDate,
                vehicleType: selectedVehicle?.id ?? null,
                fare: fare ?? null,
                fareType,
                passengerCount,
                userId: loggedInUser?.id ?? null,
            };

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/rides/book-ride`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                navigate('/ride-success', { state: { isGuest: !loggedInUser } });
            } else {
                alert(`Booking failed: ${result.error}`);
            }
        } catch (err) {
            console.error('Booking error:', err);
            alert('Error booking the ride.');
        }
    };

    const handlePassengerSubmit = async (details) => {
        setPassengerDetails(details);

        if (OTP_ENABLED) {
            setStep(4); // OTP screen
        } else {
            await handleBookRide(); // no OTP
        }
    };

    return (
        <div className="app-min-h bg-white">
            <Helmet>
                <title>Book a Taxi | Express Cabs</title>
                <meta
                    name="description"
                    content="Book your airport transfer or local ride with Express Cabs. Choose vehicle, passengers, date/time and confirm instantly."
                />
            </Helmet>

            <section className="relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="h-[520px] md:h-[600px] w-full bg-gray-900" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-white" />
                    <div className="absolute -top-32 -right-36 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
                    <div className="absolute -bottom-44 -left-36 w-[520px] h-[520px] bg-emerald-500/20 rounded-full blur-3xl" />

                    <AnimatePresence mode="wait">
                        <motion.img
                            key={heroIndex}
                            src={heroImages[heroIndex]}
                            alt="Hero"
                            className="absolute inset-0 w-full h-[520px] md:h-[600px] object-cover opacity-30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                        />
                    </AnimatePresence>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        className="max-w-3xl text-white"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                            <span className="text-xs font-semibold tracking-wide text-white/90">BOOKING</span>
                            <span className="text-white/40">•</span>
                            <span className="text-xs text-white/80">Airport & Local</span>
                        </div>

                        <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
                            Book your ride in minutes
                        </h1>

                        <p className="mt-4 text-white/85 text-lg max-w-2xl">
                            Premium airport transfers and local rides across Melbourne. Fast confirmation, professional drivers.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                                24/7 Service
                            </span>
                            <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                                Fixed & Meter Options
                            </span>
                            <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur">
                                Maxi Available
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 -mt-10 md:-mt-12 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="rounded-3xl border border-gray-200 bg-white/90 backdrop-blur shadow-[0_30px_80px_-20px_rgba(0,0,0,0.18)] p-6 md:p-10"
                >
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* LEFT */}
                        <div>
                            {!showBookingOptions ? (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-extrabold text-gray-900">Where are you going?</h2>
                                    <p className="text-sm text-gray-600">
                                        Enter pickup and dropoff. Then choose time and passengers.
                                    </p>

                                    <input
                                        id="pickup"
                                        type="text"
                                        placeholder="Pickup location"
                                        className="w-full p-3 border rounded text-black bg-white text-sm placeholder-gray-500"
                                    />
                                    <input
                                        id="dropoff"
                                        type="text"
                                        placeholder="Dropoff location"
                                        className="w-full p-3 border rounded text-black bg-white text-sm placeholder-gray-500"
                                    />

                                    <button
                                        onClick={() => setShowBookingOptions(true)}
                                        className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                                    >
                                        Continue
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {step === 1 && (
                                        <>
                                            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                                <p className="text-sm font-semibold text-gray-900">Booking options</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Choose pickup time and number of passengers.
                                                </p>

                                                <div className="mt-4 flex gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-gray-800 font-semibold">
                                                        <input
                                                            type="radio"
                                                            checked={bookingType === 'now'}
                                                            onChange={() => setBookingType('now')}
                                                        />
                                                        Now
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-gray-800 font-semibold">
                                                        <input
                                                            type="radio"
                                                            checked={bookingType === 'later'}
                                                            onChange={() => setBookingType('later')}
                                                        />
                                                        Later
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Date/Time Picker */}
                                            {bookingType === 'later' && (
                                                <div className="mb-4">
                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                        Date & Time <span className="text-red-500">*</span>
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const input = document.getElementById('scheduledDateTime');
                                                            if (input) input.showPicker?.() || input.focus();
                                                        }}
                                                        className={`w-full flex items-center justify-between gap-3 h-12 px-4 rounded-xl border bg-white transition
                                                        ${scheduledDateTime ? 'border-gray-300' : 'border-red-300'}
                                                        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
                                                                <MdCalendarToday size={18} />
                                                            </div>
                                                            <div className="min-w-0 text-left">
                                                                <p className="text-[11px] font-semibold text-gray-500">Scheduled pickup</p>
                                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                                    {scheduledDateTime
                                                                        ? new Date(scheduledDateTime).toLocaleString('en-AU', {
                                                                            weekday: 'short',
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })
                                                                        : 'Tap to choose date & time'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                                                            Select
                                                        </span>
                                                    </button>

                                                    {/* Hidden native input (still used for actual value) */}
                                                    <input
                                                        id="scheduledDateTime"
                                                        type="datetime-local"
                                                        value={scheduledDateTime}
                                                        onChange={(e) => setScheduledDateTime(e.target.value)}
                                                        className="sr-only"
                                                    />

                                                    {!scheduledDateTime && (
                                                        <p className="mt-2 text-xs text-red-600">
                                                            Please choose a date and time to continue.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Passenger Count */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Passengers <span className="text-red-500">*</span>
                                                    <span className="ml-2 text-xs font-semibold text-gray-500">(Required)</span>
                                                </label>

                                                <div className={`rounded-2xl border p-4 bg-white ${passengerCount ? 'border-gray-200' : 'border-red-300'}`}>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                                                            <button
                                                                key={n}
                                                                type="button"
                                                                onClick={() => setPassengerCount(n)}
                                                                className={`h-10 px-4 rounded-full border text-sm font-semibold transition
                                                                ${Number(passengerCount) === n
                                                                        ? 'bg-gray-900 text-white border-gray-900'
                                                                        : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {n}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="11"
                                                                value={passengerCount || ''}
                                                                onChange={(e) => {
                                                                    const value = parseInt(e.target.value);
                                                                    setPassengerCount(isNaN(value) ? '' : value);
                                                                }}
                                                                className="w-full h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                                                placeholder="Or type number (1–11)"
                                                            />
                                                        </div>

                                                        <div className="w-12 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700 font-extrabold">
                                                            {passengerCount ? passengerCount : '—'}
                                                        </div>
                                                    </div>

                                                    {!passengerCount && (
                                                        <p className="mt-2 text-xs text-red-600">
                                                            Please select passenger count to continue.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setStep(2)}
                                                disabled={!canProceedToVehicles}
                                                className="w-full h-12 rounded-xl font-semibold transition bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>

                                            <div ref={mapRef} className="h-64 mt-4 rounded overflow-hidden" />
                                        </>
                                    )}

                                    {step === 2 && (
                                        <VehicleSelection
                                            {...{
                                                pickupLoc,
                                                dropoffLoc,
                                                pickupAddress,
                                                dropoffAddress,
                                                passengerCount,
                                                bookingType,
                                                scheduledDateTime,
                                                setStep,
                                                setSelectedVehicle,
                                                setFare,
                                                setFareType,
                                                fareType,
                                                selectedVehicle,
                                                fare,
                                            }}
                                        />
                                    )}

                                    {step === 3 && (
                                        <PassengerDetails
                                            {...{
                                                setStep,
                                                onSubmitPassengerDetails: handlePassengerSubmit,
                                                pickupAddress,
                                                dropoffAddress,
                                                selectedVehicle,
                                                passengerCount,
                                                fare,
                                                fareType,
                                                scheduledDateTime,
                                                loggedInUser,
                                            }}
                                        />
                                    )}

                                    {OTP_ENABLED && step === 4 && (
                                        <OTPVerification
                                            {...{
                                                phone: passengerDetails?.phone,
                                                onSuccess: handleBookRide,
                                                onBack: () => setStep(3),
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {/* RIGHT */}
                        <div className="hidden md:block">
                            <div className="rounded-3xl border border-gray-200 bg-white p-6">
                                <p className="text-sm font-extrabold text-gray-900">Fleet preview</p>
                                <p className="text-xs text-gray-600 mt-1">Swipe-ready premium feel (auto rotates)</p>

                                <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-200 p-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-extrabold text-gray-900">{fleet[fleetIndex].name}</p>
                                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700">
                                            Up to {fleet[fleetIndex].seats}
                                        </span>
                                    </div>

                                    <div className="mt-4 h-40 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                        Vehicle image placeholder
                                    </div>

                                    <p className="mt-4 text-xs text-gray-600">
                                        Once you select pickup/dropoff, choose the best vehicle for your group.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate('/blogs')}
                                    className="mt-6 w-full h-11 rounded-xl border border-gray-200 bg-white font-semibold text-gray-900 hover:bg-gray-50 transition"
                                >
                                    Explore travel tips
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default BookingForm;
