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
  onProgressChange,
  requestedStep,
}) => {
  const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);
  const directionsRenderer = useRef(null);
  const gmapsInitRef = useRef(false);

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
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapsEnabled, setMapsEnabled] = useState(false);

  const { ready: mapsReady } = useGoogleMapsReady({ enabled: mapsEnabled });

  const handleMapIntent = useCallback(() => {
    if (!mapsEnabled) {
      setMapsEnabled(true);
    }
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

  useEffect(() => {
    if (step !== 1) {
      gmapsInitRef.current = false;
    }
  }, [step]);

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
        const transactionId = String(
          result?.id || result?.ride?.id || result?.booking?.id || Date.now()
        );
        const conversionValue = Number.isFinite(Number(fare)) ? Number(fare) : 1;

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

  const maxStepAllowed = useMemo(() => {
    let max = 1;
    if (pickupLoc && dropoffLoc) max = 2;
    if (pickupLoc && dropoffLoc && selectedVehicle) max = 3;
    if (pickupLoc && dropoffLoc && selectedVehicle && passengerDetails) {
      max = 4;
    }
    return max;
  }, [pickupLoc, dropoffLoc, selectedVehicle, passengerDetails]);

  useEffect(() => {
    if (typeof onProgressChange === 'function') {
      onProgressChange({ step, maxStepAllowed, otpEnabled: OTP_ENABLED });
    }
  }, [step, maxStepAllowed, OTP_ENABLED, onProgressChange]);

  useEffect(() => {
    if (!requestedStep) return;
    if (requestedStep <= maxStepAllowed) {
      setStep(requestedStep);
    }
  }, [requestedStep, maxStepAllowed]);

  const MapPlaceholder = () => (
    <button
      type="button"
      onClick={handleMapIntent}
      onTouchStart={handleMapIntent}
      className="h-64 mt-4 w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 text-left shadow-sm"
    >
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <p className="text-sm font-semibold text-gray-700">
            {!mapsEnabled ? 'Tap to load live map' : !mapsReady ? 'Loading live map...' : 'Preparing map...'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Start typing or tap here to activate live suggestions and routing.
          </p>
        </div>
      </div>
    </button>
  );

  const stepFallback = (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
      Loading...
    </div>
  );

  const content = (
    <>
      {step === 1 && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 md:text-2xl">Book Your Ride</h2>
              <p className="mt-1 text-sm text-gray-600">
                Enter pickup and dropoff, then choose vehicle and passenger details.
              </p>
            </div>
            <div className="hidden flex-col items-end md:flex">
              <span className="text-[11px] font-semibold text-gray-600">Fast • Secure • 24/7</span>
              <span className="mt-1 text-[11px] text-gray-500">Prime Cabs Melbourne</span>
            </div>
          </div>

          <div className="mt-5">
            <input
              ref={pickupInputRef}
              type="text"
              placeholder="Pickup address"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              onFocus={handleMapIntent}
              onChangeCapture={handleMapIntent}
              className="mb-3 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
            <input
              ref={dropoffInputRef}
              type="text"
              placeholder="Dropoff address"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              onFocus={handleMapIntent}
              onChangeCapture={handleMapIntent}
              className="mb-3 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />

            {showBookingOptions && (
              <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-black">
                <div className="mb-3">
                  <label className="mb-2 block text-sm font-semibold text-gray-800">Book for:</label>
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
                      <div className="mb-2 flex items-center gap-2 text-sm text-gray-700">
                        <MdCalendarToday className="pointer-events-none text-gray-600" size={18} />
                        <span className="pointer-events-none font-semibold">Date and Time</span>
                      </div>
                      <input
                        id="scheduledDateTime"
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
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
                      const value = parseInt(e.target.value, 10);
                      setPassengerCount(Number.isNaN(value) ? '' : value);
                    }}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    placeholder="Number of passengers"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="h-11 w-full rounded-xl bg-gray-900 font-semibold text-white transition hover:bg-black"
              disabled={!pickupLoc || !dropoffLoc}
              title={!pickupLoc || !dropoffLoc ? 'Select pickup and dropoff first' : 'Next'}
            >
              Next
            </button>

            {!mapsReady || !mapInitialized ? <MapPlaceholder /> : null}

            <div
              ref={mapRef}
              className={`${mapsReady && mapInitialized ? 'block' : 'hidden'} mt-4 h-64 overflow-hidden rounded-2xl border border-gray-200 shadow-sm`}
            />
          </div>
        </>
      )}

      {step === 2 && (
        <Suspense fallback={stepFallback}>
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
            setMap={setMap}
          />
        </Suspense>
      )}

      {step === 3 && (
        <Suspense fallback={stepFallback}>
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
        </Suspense>
      )}

      {OTP_ENABLED && step === 4 && (
        <Suspense fallback={stepFallback}>
          <OTPVerification
            setStep={setStep}
            phone={phone}
            onSuccess={handleBookRide}
            onBack={() => setStep(3)}
          />
        </Suspense>
      )}

      {!OTP_ENABLED && step === 4 && (
        <div className="py-4">
          <button
            onClick={handleBookRide}
            className="h-11 w-full rounded-xl bg-gray-900 font-semibold text-white transition hover:bg-black"
          >
            Confirm Booking
          </button>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-4 shadow-xl md:p-7">
        {content}
      </div>
    </div>
  );
};

export default BookingForm;
