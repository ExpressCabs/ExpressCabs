import React, { useEffect, useRef, useState } from 'react';
import VehicleSelection from './VehicleSelection';
import PassengerDetails from './PassengerDetails';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const AddressScreen = ({ loggedInUser }) => {
  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

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

  useEffect(() => {
    if (!mapRef.current || map) return;

    const greyMapStyle = [
      { elementType: 'geometry', stylers: [{ color: '#4b4f56' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#e0e0e0' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b7280' }],
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#5a5f66' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#374151' }],
      },
    ];

    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: greyMapStyle,
    });

    setMap(gMap);
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: gMap,
      suppressMarkers: false,
      suppressInfoWindows: true,
      polylineOptions: {
        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 5,
      },
      preserveViewport: true,
      panel: null,
    });

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
      componentRestrictions: { country: 'au' },
    });

    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        setPickupLoc(location);
        setPickupAddress(place.formatted_address || place.name);
        new window.google.maps.Marker({ position: location, map: gMap, label: 'P' });
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
        setDropoffLoc(location);
        setDropoffAddress(place.formatted_address || place.name);
        new window.google.maps.Marker({
          position: location,
          map: gMap,
          label: 'D',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        });
      }
    });
  }, [map]);

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
            const bounds = new window.google.maps.LatLngBounds();
            const route = result.routes[0];
            route.legs.forEach((leg) => {
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
            });
            map.fitBounds(bounds);
            setTimeout(() => {
              const currentZoom = map.getZoom();
              map.setZoom(currentZoom - 1);
              map.panBy(0, -100);
            }, 500);
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );
    }
  }, [pickupLoc, dropoffLoc, map]);

  const handlePassengerSubmit = (details) => {
    setPassengerDetails(details);
  };

  return (
    <div className="relative flex flex-col h-screen">
      {step === 1 && (
        <div className="relative min-h-screen bg-gray-900 text-white">
          <motion.div
            className="relative z-20 pt-16 px-4 w-full max-w-md mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <input
              type="text"
              placeholder="Pickup address"
              ref={pickupInputRef}
              className="w-full p-2 mb-3 border rounded bg-white text-black focus:ring-2 focus:ring-blue-500"
            />
            <Helmet>
              <title>Book Taxi Online | Prime Cabs Melbourne</title>
              <meta name="description" content="Easily book your ride online with Prime Cabs. Reliable airport transfers and Melbourne-wide taxi services 24/7." />
              <link rel="canonical" href="https://primecabsmelbourne.com.au/book" />
              <meta name="robots" content="index, follow" />
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "TaxiService",
                  "name": "Prime Cabs Melbourne",
                  "image": "https://primecabsmelbourne.com.au/logo.png",
                  "url": "https://primecabsmelbourne.com.au",
                  "telephone": "+61482038902",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "29 Bayswater Rd",
                    "addressLocality": "Croydon",
                    "addressRegion": "VIC",
                    "postalCode": "3136",
                    "addressCountry": "AU"
                  },
                  "priceRange": "$$",
                  "areaServed": {
                    "@type": "Place",
                    "name": "Melbourne Metropolitan Area"
                  },
                  "description": "24/7 airport taxi and cab booking service in Melbourne. Instant fare estimate, online booking, and professional drivers.",
                })}
              </script>
            </Helmet>
            <input
              type="text"
              placeholder="Dropoff address"
              ref={dropoffInputRef}
              className="w-full p-2 mb-3 border rounded bg-white text-black focus:ring-2 focus:ring-blue-500"
            />

            {showBookingOptions && (
              <motion.div
                className="bg-white/90 backdrop-blur-md p-4 rounded-xl text-black space-y-4 shadow-xl mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div>
                  <label className="block font-medium text-sm mb-1">Book for:</label>
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
                      />{' '}Now
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="bookingType"
                        value="later"
                        checked={bookingType === 'later'}
                        onChange={() => setBookingType('later')}
                      />{' '}Later
                    </label>
                  </div>
                </div>

                {bookingType === 'later' && (
                  <div>
                    <label className="block font-medium text-sm mb-1">Select Date & Time:</label>
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => {
                        const selected = new Date(e.target.value);
                        const now = new Date();
                        if (selected < now) {
                          alert("❌ Cannot select a past time.");
                          return;
                        }
                        setScheduledDateTime(e.target.value);
                      }}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}

                <div>
                  <label className="block font-medium text-sm mb-1">Number of Passengers:</label>
                  <input
                    type="number"
                    min="1"
                    max="11"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                  disabled={!pickupLoc || !dropoffLoc || (bookingType === 'later' && !scheduledDateTime)}
                >
                  Next
                </button>
              </motion.div>
            )}
          </motion.div>

          <div ref={mapRef} id="map" className="absolute inset-0 z-0" />
        </div>
      )}

      {step === 2 && (
        <VehicleSelection
          pickupLoc={pickupLoc}
          dropoffLoc={dropoffLoc}
          passengerCount={passengerCount}
          bookingType={bookingType}
          scheduledDateTime={scheduledDateTime}
          setStep={setStep}
          setSelectedVehicle={setSelectedVehicle}
          setFare={setFare}
          setFareType={setFareType}
        />
      )}

      {step === 3 && (
        <PassengerDetails
          setStep={setStep}
          onSubmitPassengerDetails={handlePassengerSubmit}
          pickupLoc={pickupLoc}
          dropoffLoc={dropoffLoc}
          pickupAddress={pickupAddress}
          dropoffAddress={dropoffAddress}
          selectedVehicle={selectedVehicle}
          passengerCount={passengerCount}
          fare={fare}
          fareType={fareType}
          scheduledDateTime={scheduledDateTime}
          loggedInUser={loggedInUser}
        />
      )}
    </div>
  );
};

export default AddressScreen;
