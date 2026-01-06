// AddressScreen.jsx – visually enhanced modern layout (Webjet-like polish)
// NOTE: Booking flow logic/handlers remain unchanged.
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VehicleSelection from './VehicleSelection';
import PassengerDetails from './PassengerDetails';
import OTPVerification from './OTPVerification';
import { Helmet } from 'react-helmet-async';
import ContactUs from './ContactUs';
import OurServices from './OurServices';
import { MdCalendarToday } from 'react-icons/md';
import BlogPreviewCarousel from '../components/BlogPreviewCarousel';

const heroImages = [
  '/assets/images/prime_cabs_landscape.png',
  '/assets/images/prime_cabs_landscape2.png',
  '/assets/images/prime_cabs_landscape3.png',
  '/assets/images/prime_cabs_landscape4.png',
];

const fleet = [
  { name: 'Sedan', seats: 4, image: '/assets/vehicles/sedan-modern.png' },
  { name: 'Luxury', seats: 4, image: '/assets/vehicles/luxury-modern.png' },
  { name: 'SUV', seats: 6, image: '/assets/vehicles/suv-modern.png' },
  { name: 'Van', seats: 11, image: '/assets/vehicles/van-modern.png' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: 'easeOut' },
  }),
};

const softIn = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

function StepPill({ label, active, done }) {
  return (
    <div
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition',
        done
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : active
          ? 'bg-white border-gray-200 text-gray-900 shadow-sm'
          : 'bg-white/20 border-white/20 text-white/85 backdrop-blur',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-extrabold',
          done
            ? 'bg-emerald-600 text-white'
            : active
            ? 'bg-gray-900 text-white'
            : 'bg-white/15 text-white',
        ].join(' ')}
      >
        {done ? '✓' : '•'}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

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

  // Keep only one interval (your file had duplicate interval effect)
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

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
      componentRestrictions: { country: 'au' },
    });

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

    const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInputRef.current, {
      componentRestrictions: { country: 'au' },
    });

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
      directionsService.route(
        {
          origin: pickupLoc,
          destination: dropoffLoc,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.current.setDirections(result);
            map.fitBounds(result.routes[0].bounds);
          }
        }
      );
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

  const stepMeta = useMemo(() => {
    // Step mapping: 1=address,2=vehicle,3=passenger,4=otp (if enabled)
    const labels = [
      { key: 1, label: 'Book' },
      { key: 2, label: 'Vehicle' },
      { key: 3, label: 'Passenger' },
      ...(OTP_ENABLED ? [{ key: 4, label: 'Verify' }] : []),
    ];
    return labels;
  }, [OTP_ENABLED]);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Prime Cabs Melbourne | Book Airport Taxi</title>
        <meta
          name="description"
          content="24/7 Melbourne airport transfers, fixed fare taxi bookings. Book online with Prime Cabs."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Airport Transfer Taxi",
            "name": "Melbourne Airport Taxi Transfers - Prime Cabs",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Prime Cabs Melbourne",
              "url": "https://www.primecabsmelbourne.com.au",
              "image": "https://www.primecabsmelbourne.com.au/logo.png",
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
              { "@type": "Place", "name": "Melbourne" },
              { "@type": "Place", "name": "Tullamarine Airport" },
              { "@type": "Place", "name": "Avalon Airport" }
            ],
            "description":
              "24/7 airport transfer taxi service in Melbourne. Reliable pickups and drop-offs to and from Tullamarine and Avalon Airport. Choose from Sedans, SUVs, Vans and Luxury Cabs.",
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": "https://www.primecabsmelbourne.com.au/airport-taxi-melbourne"
            },
            "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Fleet Options",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Sedan Airport Transfer",
                  "description": "Standard 4-seater for airport transfers."
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Luxury Airport Transfer",
                  "description": "Premium ride experience with a luxury vehicle."
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "SUV Airport Transfer",
                  "description": "Spacious SUV, ideal for families or groups."
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Van Airport Transfer",
                  "description": "High-capacity van for group transfers, up to 11 passengers."
                }
              }
            ]
          }

          })}
        </script>
      </Helmet>

      {/* HERO + BOOKING FLOW */}
      <section className="relative min-h-[100vh] overflow-hidden">
        {/* Background slideshow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={heroIndex}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImages[heroIndex]})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </AnimatePresence>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/35" />
        <div className="absolute inset-0">
          <div className="absolute -top-36 -right-40 w-[520px] h-[520px] bg-indigo-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-48 -left-40 w-[520px] h-[520px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-[100vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
            {/* Left: headline + trust */}
            <motion.div
              className="lg:col-span-6 text-white"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
                <span className="text-xs font-semibold tracking-wide">MELBOURNE AIRPORT TRANSFERS</span>
              </div>

              <motion.h1
                custom={1}
                variants={fadeUp}
                className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]"
              >
                Book a reliable taxi in minutes.
              </motion.h1>

              <motion.p custom={2} variants={fadeUp} className="mt-5 text-lg md:text-xl text-white/85 max-w-xl">
                Fixed fare airport transfers with professional drivers and comfortable vehicles.
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="mt-7 flex flex-wrap gap-2">
                {['24/7 Available', 'Fixed Upfront Quotes', 'Airport Specialists', 'Clean Vehicles'].map((t) => (
                  <span
                    key={t}
                    className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur"
                  >
                    {t}
                  </span>
                ))}
              </motion.div>

              <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-wrap gap-2">
                {stepMeta.map((s) => (
                  <StepPill
                    key={s.key}
                    label={s.label}
                    active={step === s.key}
                    done={step > s.key}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Right: booking card (logic unchanged) */}
            <div className="lg:col-span-6">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={softIn}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-white/25 via-white/10 to-white/25 blur-xl" />
                <div className="relative rounded-[28px] border border-white/20 bg-white/85 backdrop-blur-xl shadow-[0_30px_90px_-30px_rgba(0,0,0,0.6)] p-5 md:p-7">
                  {step === 1 && (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Book Your Ride</h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Enter pickup & dropoff, then choose vehicle and passenger details.
                          </p>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-[11px] font-semibold text-gray-600">Fast • Secure • 24/7</span>
                          <span className="text-[11px] text-gray-500 mt-1">Prime Cabs Melbourne</span>
                        </div>
                      </div>

                      {/* Inputs (unchanged handlers/values) */}
                      <div className="mt-5">
                        <input
                          ref={pickupInputRef}
                          type="text"
                          placeholder="Pickup address"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          className="w-full mb-3 h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                        />
                        <input
                          ref={dropoffInputRef}
                          type="text"
                          placeholder="Dropoff address"
                          value={dropoffAddress}
                          onChange={(e) => setDropoffAddress(e.target.value)}
                          className="w-full mb-3 h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                        />

                        {showBookingOptions && (
                          <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl mb-3 text-black">
                            {/* Book for Now or Later (unchanged) */}
                            <div className="mb-3">
                              <label className="block text-sm font-semibold mb-2 text-gray-800">Book for:</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="radio"
                                    name="bookingType"
                                    value="now"
                                    checked={bookingType === 'now'}
                                    onChange={() => {
                                      setBookingType('now');
                                      setScheduledDateTime('');
                                    }}
                                  />
                                  Now
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="radio"
                                    name="bookingType"
                                    value="later"
                                    checked={bookingType === 'later'}
                                    onChange={() => setBookingType('later')}
                                  />
                                  Later
                                </label>
                              </div>
                            </div>

                            {/* Date/Time Picker (unchanged) */}
                            {bookingType === 'later' && (
                              <div className="mb-3">
                                <label
                                  htmlFor="scheduledDateTime"
                                  className="block w-full cursor-pointer"
                                  onClick={() => {
                                    const input = document.getElementById('scheduledDateTime');
                                    if (input) input.showPicker?.() || input.focus();
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2 text-gray-700 text-sm">
                                    <MdCalendarToday className="text-gray-600 pointer-events-none" size={18} />
                                    <span className="font-semibold pointer-events-none">Date & Time</span>
                                  </div>
                                  <input
                                    id="scheduledDateTime"
                                    type="datetime-local"
                                    value={scheduledDateTime}
                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                    className="w-full h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                    placeholder="Select date and time"
                                  />
                                </label>
                              </div>
                            )}

                            {/* Passenger Count (unchanged) */}
                            <div>
                              <input
                                type="number"
                                min="1"
                                value={passengerCount || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  setPassengerCount(isNaN(value) ? '' : value);
                                }}
                                className="w-full h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                placeholder="Number of passengers"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setStep(2)}
                          className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
                        >
                          Next
                        </button>

                        {/* Map (unchanged) */}
                        <div ref={mapRef} className="h-64 mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <VehicleSelection
                      {...{
                        pickupLoc,
                        dropoffLoc,
                        passengerCount,
                        bookingType,
                        scheduledDateTime,
                        setStep,
                        setSelectedVehicle,
                        setFare,
                        setFareType,
                        setMap,
                      }}
                    />
                  )}

                  {step === 3 && (
                    <PassengerDetails
                      {...{
                        setStep,
                        onSubmitPassengerDetails: handlePassengerSubmit,
                        pickupLoc,
                        dropoffLoc,
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
                        setStep,
                        phone,
                        onSuccess: handleBookRide,
                        onBack: () => setStep(3),
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* FLEET SECTION (upgraded visuals) */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Our Fleet</h2>
            <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
              Choose the right vehicle for your trip — from standard sedans to group vans.
            </p>
          </motion.div>

          <div className="mt-10">
            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
              {fleet.map((car, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: 0.05 * index, ease: 'easeOut' }}
                  className="group bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="mx-auto h-40 object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900">{car.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Seats up to {car.seats}</p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white">
                        Popular
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['Luggage friendly', 'Comfort ride'].map((t) => (
                        <span key={t} className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile carousel card */}
            <div className="block md:hidden bg-white p-6 rounded-3xl border border-gray-200 shadow-sm max-w-md mx-auto">
              <motion.div
                key={fleetIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                  <img
                    src={fleet[fleetIndex].image}
                    alt={fleet[fleetIndex].name}
                    className="mx-auto h-40 object-contain"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mt-5">{fleet[fleetIndex].name}</h3>
                <p className="text-sm text-gray-600 mt-1">Seats up to {fleet[fleetIndex].seats} passengers</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white">Popular</span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700">Comfort ride</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8">
       <BlogPreviewCarousel />
      </div>

      <div className="mt-8">
        <OurServices />
      </div> 
    
      <ContactUs />
    </div>
  );
};

export default AddressScreen;
