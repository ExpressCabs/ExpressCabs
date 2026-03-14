import React, { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { MdCalendarToday } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { fireBookingConversion } from '../lib/adsTracking';
import { useGoogleMapsReady } from '../utils/useGoogleMapsReady';

const VehicleSelection = lazy(() => import('../screens/VehicleSelection'));
const PassengerDetails = lazy(() => import('../screens/PassengerDetails'));
const OTPVerification = lazy(() => import('../screens/OTPVerification'));

const BookingForm = ({
  loggedInUser,
  embedded = false,

  // âœ… NEW: parent can listen for step/progress updates
  onProgressChange,

  // âœ… NEW: parent can request step changes (for clickable pills)
  requestedStep,
}) => {
  const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';
  const navigate = useNavigate();

  // Google Maps refs
  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);
  const directionsRenderer = useRef(null);

  // Prevent double init
  const gmapsInitRef = useRef(false);

  // Booking states (same logic)
  const [map, setMap] = useState(null);
  const [pickupLoc, setPickupLoc] = useState(null);
  const [dropoffLoc, setDropoffLoc] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [bookingType, setBookingType] = useState('now');
  const [passengerCount, setPassengerCount] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [showBookingOptions, setShowBookingOptions] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fare, setFare] = useState(null);
  const [fareType, setFareType] = useState('');
  const [passengerDetails, setPassengerDetails] = useState(null);

  // âœ… NEW: map placeholder control
  const [mapInitialized, setMapInitialized] = useState(false);

  // Lazy-load maps only after user interacts
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const { ready: mapsReady } = useGoogleMapsReady({ enabled: mapsEnabled });

  const handleAddressFocus = useCallback(() => {
    if (!mapsEnabled) setMapsEnabled(true);
  }, [mapsEnabled]);

  const initMapAndAutocomplete = useCallback(() => {
    if (gmapsInitRef.current) return;
    if (step !== 1) return;
    if (!mapsReady) return;

    if (!window.google?.maps?.Map || !window.google?.maps?.places?.Autocomplete) return;
    if (!mapRef.current || !pickupInputRef.current || !dropoffInputRef.current) return;

    gmapsInitRef.current = true;

    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });

    setMap(gMap);
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({ map: gMap });

    // âœ… mark initialized so placeholder disappears
    setMapInitialized(true);

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
      componentRestrictions: { country: 'au' },
    });

    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place?.geometry) {
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
      if (place?.geometry) {
        const location = place.geometry.location;
        if (dropoffMarker.current) dropoffMarker.current.setMap(null);
        dropoffMarker.current = new window.google.maps.Marker({ position: location, map: gMap, label: 'D' });
        setDropoffLoc(location);
        setDropoffAddress(place.formatted_address || place.name);
        gMap.setCenter(location);
      }
    });
  }, [mapsReady, step]);

  // Init when maps become ready; retry a few frames
  // Auto-load maps shortly after page is visible (trust boost), without blocking initial paint
  useEffect(() => {
    if (mapsEnabled) return;

    const t = setTimeout(() => {
      setMapsEnabled(true);
    }, 1200); // 1.2s (you can change to 1000â€“2000)

    return () => clearTimeout(t);
  }, [mapsEnabled]);

  useEffect(() => {
    if (step !== 1 || !mapsReady) return;

    initMapAndAutocomplete();

    let tries = 0;
    const retry = () => {
      tries += 1;
      if (gmapsInitRef.current) return;
      initMapAndAutocomplete();
      if (!gmapsInitRef.current && tries < 12) requestAnimationFrame(retry);
    };

    if (!gmapsInitRef.current) requestAnimationFrame(retry);
  }, [step, mapsReady, initMapAndAutocomplete]);

  // Reset init flag if user leaves step 1 (so it works when returning)
  useEffect(() => {
    if (step !== 1) gmapsInitRef.current = false;
  }, [step]);

  // Directions once both locations are selected
  useEffect(() => {
    if (pickupLoc && dropoffLoc && map && window.google?.maps) {
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
            directionsRenderer.current?.setDirections(result);
            map.fitBounds(result.routes[0].bounds);
          }
        }
      );
    }
  }, [pickupLoc, dropoffLoc, map]);

  const handlePassengerSubmit = (details) => {
    setPassengerDetails(details);
    setStep(OTP_ENABLED ? 4 : 4);
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
        const transactionId = String(
          result?.id || result?.ride?.id || result?.booking?.id || Date.now()
        );
        const conversionValue = Number.isFinite(Number(fare)) ? Number(fare) : 1;

        window.gtag?.('event', 'booking_submit', {
          currency: 'AUD',
          value: conversionValue,
          booking_type: bookingType,
          passenger_count: Number(passengerCount) || undefined,
          vehicle_type: selectedVehicle?.id || undefined,
        });

        fireBookingConversion({
          value: conversionValue,
          transactionId,
          name: passengerDetails?.name,
          email: passengerDetails?.email,
          phone: passengerDetails?.phone,
        });

        navigate('/ride-success', {
          state: {
            isGuest: !loggedInUser,
            bookingId: result?.id,
            totalFare: result?.fare ?? fare,
          },
        });
      } else {
        alert(`Booking failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Error booking the ride.');
    }
  };

  const phone = passengerDetails?.phone ?? '';

  // âœ… NEW: compute how far user is allowed to jump
  const maxStepAllowed = useMemo(() => {
    // step 1 always allowed
    let max = 1;

    // allow step 2 when both locations selected
    if (pickupLoc && dropoffLoc) max = 2;

    // allow step 3 when vehicle selected (or at least reached step 2 properly)
    if (pickupLoc && dropoffLoc && selectedVehicle) max = 3;

    // allow step 4 when passenger details exist
    if (pickupLoc && dropoffLoc && selectedVehicle && passengerDetails) {
      max = OTP_ENABLED ? 4 : 4;
    }

    return max;
  }, [pickupLoc, dropoffLoc, selectedVehicle, passengerDetails, OTP_ENABLED]);

  // âœ… NEW: notify parent about current step/progress so pills update
  useEffect(() => {
    if (typeof onProgressChange === 'function') {
      onProgressChange({ step, maxStepAllowed, otpEnabled: OTP_ENABLED });
    }
  }, [step, maxStepAllowed, OTP_ENABLED, onProgressChange]);

  // âœ… NEW: allow parent to request a step (clickable pills)
  useEffect(() => {
    if (!requestedStep) return;

    // only allow moving within permitted steps
    if (requestedStep <= maxStepAllowed) {
      setStep(requestedStep);
    }
    // else ignore silently (prevents skipping required steps)
  }, [requestedStep, maxStepAllowed]);

  const MapPlaceholder = () => (
    <div className="h-64 mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-gray-200 animate-pulse mb-3" />
          <p className="text-sm font-semibold text-gray-700">
            {!mapsEnabled ? 'Loading live mapâ€¦' : !mapsReady ? 'Loading live mapâ€¦' : 'Preparing mapâ€¦'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Start typing your address to activate suggestions.
          </p>
        </div>
      </div>
    </div>
  );

  const stepFallback = (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
      Loading...
    </div>
  );

  // âœ… EMBEDDED UI (matches your AddressScreen card styling)
  const content = (
    <>
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
              <span className="text-[11px] font-semibold text-gray-600">Fast â€¢ Secure â€¢ 24/7</span>
              <span className="text-[11px] text-gray-500 mt-1">Prime Cabs Melbourne</span>
            </div>
          </div>

          <div className="mt-5">
            <input
              ref={pickupInputRef}
              type="text"
              placeholder="Pickup address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              onFocus={handleAddressFocus}
              className="w-full mb-3 h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
            <input
              ref={dropoffInputRef}
              type="text"
              placeholder="Dropoff address"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              onFocus={handleAddressFocus}
              className="w-full mb-3 h-11 px-3 border border-gray-200 rounded-xl text-black bg-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />

            {showBookingOptions && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl mb-3 text-black">
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
              disabled={!pickupLoc || !dropoffLoc}
              title={!pickupLoc || !dropoffLoc ? 'Select pickup and dropoff first' : 'Next'}
            >
              Next
            </button>

            {!mapsReady || !mapInitialized ? <MapPlaceholder /> : null}

            <div
              ref={mapRef}
              className={`${mapsReady && mapInitialized ? 'block' : 'hidden'} h-64 mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm`}
            />
          </div>
        </>
      )}

      {step === 2 && (
        <Suspense fallback={stepFallback}>
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
        </Suspense>
      )}

      {step === 3 && (
        <Suspense fallback={stepFallback}>
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
        </Suspense>
      )}

      {OTP_ENABLED && step === 4 && (
        <Suspense fallback={stepFallback}>
          <OTPVerification
            {...{
              setStep,
              phone,
              onSuccess: handleBookRide,
              onBack: () => setStep(3),
            }}
          />
        </Suspense>
      )}

      {!OTP_ENABLED && step === 4 && (
        <div className="py-4">
          <button
            onClick={handleBookRide}
            className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition"
          >
            Confirm Booking
          </button>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white shadow-xl p-4 md:p-7">
        {content}
      </div>
    </div>
  );
};

export default BookingForm;
