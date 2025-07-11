// AddressScreen.jsx – Unified layout: all booking steps share hero background and structure
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VehicleSelection from './VehicleSelection';
import PassengerDetails from './PassengerDetails';
import OTPVerification from './OTPVerification';
import { Helmet } from 'react-helmet-async';
import ContactUs from './ContactUs';
import OurServices from './OurServices';
import { MdCalendarToday } from 'react-icons/md';


const heroImages = ['/assets/images/prime_cabs_landscape.png', '/assets/images/prime_cabs_landscape2.png', '/assets/images/prime_cabs_landscape3.png', '/assets/images/prime_cabs_landscape4.png'];
const fleet = [
  { name: 'Sedan', seats: 4, image: '/assets/vehicles/sedan-modern.png' },
  { name: 'Luxury', seats: 4, image: '/assets/vehicles/luxury-modern.png' },
  { name: 'SUV', seats: 6, image: '/assets/vehicles/suv-modern.png' },
  { name: 'Van', seats: 11, image: '/assets/vehicles/van-modern.png' },
];

const AddressScreen = ({ loggedInUser }) => {
  useEffect(() => {
    const fleetTimer = setInterval(() => {
      setFleetIndex((prev) => (prev + 1) % fleet.length);
    }, 2000);
    return () => clearInterval(fleetTimer);
  }, []);

  const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);

  const [map, setMap] = useState(null);
  const [pickupLoc, setPickupLoc] = useState(null);
  const [dropoffLoc, setDropoffLoc] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const directionsRenderer = useRef(null);
  const [bookingType, setBookingType] = useState('now');
  const [passengerCount, setPassengerCount] = useState(1);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fare, setFare] = useState(null);
  const [fareType, setFareType] = useState('');
  const [passengerDetails, setPassengerDetails] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [fleetIndex, setFleetIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step !== 1 || !mapRef.current) return;
    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });
    setMap(gMap);
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({ map: gMap });

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, { componentRestrictions: { country: 'au' } });
    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        if (pickupMarker.current) pickupMarker.current.setMap(null);
        pickupMarker.current = new window.google.maps.Marker({ position: location, map: gMap, label: 'P' });
        setPickupLoc(location);
        setPickupAddress(place.formatted_address || place.name);
        gMap.setCenter(location);
      }
    });

    const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInputRef.current, { componentRestrictions: { country: 'au' } });
    dropoffAutocomplete.addListener('place_changed', () => {
      const place = dropoffAutocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        if (dropoffMarker.current) dropoffMarker.current.setMap(null);
        dropoffMarker.current = new window.google.maps.Marker({ position: location, map: gMap, label: 'D' });
        setDropoffLoc(location);
        setDropoffAddress(place.formatted_address || place.name);
        gMap.setCenter(location);
      }
    });
  }, [step]);

  useEffect(() => {
    if (pickupLoc && dropoffLoc && map) {
      setShowBookingOptions(true);
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: pickupLoc,
        destination: dropoffLoc,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
          map.fitBounds(result.routes[0].bounds);
        }
      });
    }
  }, [pickupLoc, dropoffLoc, map]);

  const handlePassengerSubmit = (details) => {
    setPassengerDetails(details);
    setStep(4);
  };

  const handleBookRide = async () => {
    if (!pickupLoc || !dropoffLoc || !passengerDetails) return;
    const rideDate = bookingType === 'later' ? new Date(scheduledDateTime) : new Date();
    const payload = {
      name: passengerDetails.name,
      phone: passengerDetails.phone,
      email: passengerDetails.email,
      note: passengerDetails.note,
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

    try {
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

  const phone = passengerDetails?.phone ?? '';

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Prime Cabs Melbourne | Book Airport Taxi</title>
        <meta name="description" content="24/7 Melbourne airport transfers, fixed fare taxi bookings. Book online with Prime Cabs." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Airport Transfer Taxi",
            "name": "Melbourne Airport Taxi Transfers - Prime Cabs",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Prime Cabs Melbourne",
              "url": "https://primecabsmelbourne.com.au",
              "image": "https://primecabsmelbourne.com.au/logo.png",
              "telephone": "+61482038902",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "29 Bayswater Rd",
                "addressLocality": "Croydon",
                "addressRegion": "VIC",
                "postalCode": "3136",
                "addressCountry": "AU"
              }
            },
            "areaServed": [
              {
                "@type": "Place",
                "name": "Melbourne"
              },
              {
                "@type": "Place",
                "name": "Tullamarine Airport"
              },
              {
                "@type": "Place",
                "name": "Avalon Airport"
              }
            ],
            "description": "24/7 airport transfer taxi service in Melbourne. Reliable pickups and drop-offs to and from Tullamarine and Avalon Airport. Choose from Sedans, SUVs, Vans and Luxury Cabs.",
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": "https://primecabsmelbourne.com.au/airport-taxi-melbourne"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Fleet Options",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Sedan",
                    "description": "Standard 4-seater for airport transfers."
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Luxury",
                    "description": "Premium ride experience with luxury vehicle."
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "SUV",
                    "description": "Spacious SUV, ideal for families or groups."
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Product",
                    "name": "Van",
                    "description": "High-capacity van for group transfers, up to 11 passengers."
                  }
                }
              ]
            }
          })}
        </script>
      </Helmet>

      {/* HERO + BOOKING FLOW */}
      <div className="relative min-h-[100vh] bg-cover bg-center text-white flex items-center justify-center" style={{ backgroundImage: `url(${heroImages[heroIndex]})` }}>

        <AnimatePresence mode="wait">
          <motion.div
            key={heroIndex}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImages[heroIndex]})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 w-full max-w-xl mx-auto px-4">
          <div className="relative z-20 w-full p-6 bg-white rounded-xl shadow-lg">
            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Book Your Ride</h2>
                <input
                  ref={pickupInputRef}
                  type="text"
                  placeholder="Pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full mb-3 p-2 border rounded text-black"
                />
                <input
                  ref={dropoffInputRef}
                  type="text"
                  placeholder="Dropoff address"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  className="w-full mb-3 p-2 border rounded text-black"
                />
                {showBookingOptions && (
                  <div className="bg-gray-100 p-3 rounded mb-3 text-black">
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Book for:</label>
                      <div className="flex gap-4">
                        <label>
                          <input
                            type="radio"
                            name="bookingType"
                            value="now"
                            checked={bookingType === 'now'}
                            onChange={() => {
                              setBookingType('now');
                              setScheduledDateTime('');
                            }}
                          />{' '}
                          Now
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="bookingType"
                            value="later"
                            checked={bookingType === 'later'}
                            onChange={() => setBookingType('later')}
                          />{' '}
                          Later
                        </label>
                      </div>
                    </div>
                    {bookingType === 'later' && (
                      <div className="relative mb-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 flex justify-center items-center h-full">
                          <MdCalendarToday size={18} />
                        </span>
                        <input
                          type="datetime-local"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                          className="w-full h-11 p-2 pl-10 border rounded text-black bg-white placeholder-gray-500"
                          placeholder="Select date and time"
                        />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      max="11"
                      value={passengerCount === 1 ? '' : passengerCount}
                      onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border rounded text-black bg-white mt-2"
                      placeholder="Number of passengers"
                    />
                  </div>
                )}
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
                >
                  Next
                </button>
                <div ref={mapRef} className="h-64 mt-4 rounded overflow-hidden" />
              </>

            )}
            {step === 2 && (
              <VehicleSelection {...{ pickupLoc, dropoffLoc, passengerCount, bookingType, scheduledDateTime, setStep, setSelectedVehicle, setFare, setFareType, setMap }} />
            )}
            {step === 3 && <PassengerDetails {...{ setStep, onSubmitPassengerDetails: handlePassengerSubmit, pickupLoc, dropoffLoc, pickupAddress, dropoffAddress, selectedVehicle, passengerCount, fare, fareType, scheduledDateTime, loggedInUser }} />}
            {OTP_ENABLED && step === 4 && <OTPVerification {...{ setStep, phone, onSuccess: handleBookRide, onBack: () => setStep(3) }} />}
          </div>
        </div>
      </div>

      {/* FLEET SECTION */}
      <section className="py-16 px-4 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-6">Our Fleet</h2>
        <div className="w-full max-w-6xl mx-auto">
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
            {fleet.map((car, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-xl">
                <img src={car.image} alt={car.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="mx-auto h-40 object-contain mb-4" />
                <h3 className="text-xl font-semibold">{car.name}</h3>
                <p className="text-sm text-gray-600">Seats up to {car.seats} passengers</p>
              </div>
            ))}
          </div>
          <div className="block md:hidden bg-white p-6 rounded-xl shadow-xl max-w-md mx-auto transition-all duration-500">
            <motion.img key={fleetIndex} src={fleet[fleetIndex].image} alt={fleet[fleetIndex].name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="mx-auto h-40 object-contain mb-4" />
            <h3 className="text-xl font-semibold">{fleet[fleetIndex].name}</h3>
            <p className="text-sm text-gray-600">Seats up to {fleet[fleetIndex].seats} passengers</p>
          </div>
        </div>
      </section>

      <OurServices />
      <ContactUs />
    </div>
  );
};

export default AddressScreen;
