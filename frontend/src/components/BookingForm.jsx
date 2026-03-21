import React, { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { MdCalendarToday } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { fireBookingConversion } from '../lib/adsTracking';
import { trackAnalyticsEvent } from '../lib/tracking/events';
import { getOrCreateSessionToken } from '../lib/tracking/session';
import { estimateFareRange, isMelbourneAirport } from '../lib/ridePricing';
import { toast } from './ToastProvider';
import { useGoogleMapsReady } from '../utils/useGoogleMapsReady';

const VehicleSelection = lazy(() => import('../screens/VehicleSelection'));
const PassengerDetails = lazy(() => import('../screens/PassengerDetails'));
const OTPVerification = lazy(() => import('../screens/OTPVerification'));

const MODERN_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#eef2ff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d1fae5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dbe4f0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#93c5fd' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
];

const BookingForm = ({
  loggedInUser,
  embedded = false,
  onProgressChange,
  requestedStep,
}) => {
  const OTP_ENABLED = import.meta.env.VITE_OTP_VERIFICATION_ENABLED === 'true';
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const tripEstimateRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);
  const directionsRenderer = useRef(null);
  const gmapsInitRef = useRef(false);
  const prevHasPassengerCountRef = useRef(false);
  const bookingStartedTrackedRef = useRef(false);
  const pickupTrackedRef = useRef('');
  const dropoffTrackedRef = useRef('');
  const fareTrackedRef = useRef('');
  const vehicleTrackedRef = useRef('');
  const submitAttemptTrackedRef = useRef(false);
  const submitSuccessTrackedRef = useRef(false);

  const [map, setMap] = useState(null);
  const [pickupLoc, setPickupLoc] = useState(null);
  const [dropoffLoc, setDropoffLoc] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupSuburb, setPickupSuburb] = useState('');
  const [dropoffSuburb, setDropoffSuburb] = useState('');
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
  const [routePreview, setRoutePreview] = useState(null);

  const { ready: mapsReady } = useGoogleMapsReady({ enabled: mapsEnabled });

  const fireSubmitGa4Event = useCallback((eventName, params = {}) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', eventName, params);
  }, []);

  const trackBookingStarted = useCallback(() => {
    if (bookingStartedTrackedRef.current) {
      return;
    }

    bookingStartedTrackedRef.current = true;
    fireSubmitGa4Event('booking_started', {
      debug_mode: true,
    });
    trackAnalyticsEvent('booking_started', {
      stepName: 'address_entry',
      bookingType,
      entrySurface: embedded ? 'embedded_booking_form' : 'booking_form',
    });
  }, [bookingType, embedded, fireSubmitGa4Event]);

  const extractSuburbFromPlace = useCallback((place) => {
    const components = Array.isArray(place?.address_components) ? place.address_components : [];
    const localityComponent = components.find((component) =>
      Array.isArray(component.types) &&
      ['locality', 'postal_town', 'administrative_area_level_2', 'sublocality', 'sublocality_level_1'].some((type) =>
        component.types.includes(type)
      )
    );

    if (localityComponent?.long_name) {
      return localityComponent.long_name;
    }

    const addressText = place?.formatted_address || place?.name || '';
    const match = addressText.match(/,\s*([^,]+?)(?:\s+VIC|\s+\d{4}|,|$)/i);
    return match?.[1]?.trim() || addressText;
  }, []);

  const handleMapIntent = useCallback(() => {
    trackBookingStarted();
    if (!mapsEnabled) {
      setMapsEnabled(true);
    }
  }, [mapsEnabled, trackBookingStarted]);

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
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      styles: MODERN_MAP_STYLES,
    });

    setMap(gMap);
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      map: gMap,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#111827',
        strokeOpacity: 0.95,
        strokeWeight: 6,
      },
    });
    setMapInitialized(true);

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
      componentRestrictions: { country: 'au' },
    });

    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place?.geometry) {
        trackBookingStarted();
        const location = place.geometry.location;
        if (pickupMarker.current) pickupMarker.current.setMap(null);
        pickupMarker.current = new window.google.maps.Marker({
          position: location,
          map: gMap,
          label: { text: 'P', color: '#ffffff', fontWeight: '700' },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#0f172a',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 11,
          },
        });
        setPickupLoc(location);
        setPickupAddress(place.formatted_address || place.name);
        const pickupSuburb = extractSuburbFromPlace(place);
        setPickupSuburb(pickupSuburb);
        gMap.setCenter(location);

        const eventKey = `${pickupSuburb}:${place.formatted_address || place.name || ''}`;
        if (pickupTrackedRef.current !== eventKey) {
          pickupTrackedRef.current = eventKey;
          fireSubmitGa4Event('pickup_entered', {
            pickup_suburb: pickupSuburb,
            debug_mode: true,
          });
          trackAnalyticsEvent('pickup_entered', {
            stepName: 'address_entry',
            pickupSuburb,
            isAirportPickup: isMelbourneAirport(place.formatted_address || place.name || ''),
            bookingType,
            passengerCount: Number(passengerCount) || undefined,
            metadata: {
              pickupAddress: place.formatted_address || place.name || '',
            },
          });
        }
      }
    });

    const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffInputRef.current, {
      componentRestrictions: { country: 'au' },
    });

    dropoffAutocomplete.addListener('place_changed', () => {
      const place = dropoffAutocomplete.getPlace();
      if (place?.geometry) {
        trackBookingStarted();
        const location = place.geometry.location;
        if (dropoffMarker.current) dropoffMarker.current.setMap(null);
        dropoffMarker.current = new window.google.maps.Marker({
          position: location,
          map: gMap,
          label: { text: 'D', color: '#ffffff', fontWeight: '700' },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 11,
          },
        });
        setDropoffLoc(location);
        setDropoffAddress(place.formatted_address || place.name);
        const dropoffSuburb = extractSuburbFromPlace(place);
        setDropoffSuburb(dropoffSuburb);
        gMap.setCenter(location);

        const eventKey = `${dropoffSuburb}:${place.formatted_address || place.name || ''}`;
        if (dropoffTrackedRef.current !== eventKey) {
          dropoffTrackedRef.current = eventKey;
          fireSubmitGa4Event('dropoff_entered', {
            dropoff_suburb: dropoffSuburb,
            debug_mode: true,
          });
          trackAnalyticsEvent('dropoff_entered', {
            stepName: 'address_entry',
            dropoffSuburb,
            isAirportDropoff: isMelbourneAirport(place.formatted_address || place.name || ''),
            bookingType,
            passengerCount: Number(passengerCount) || undefined,
            metadata: {
              dropoffAddress: place.formatted_address || place.name || '',
            },
          });
        }
      }
    });
  }, [bookingType, extractSuburbFromPlace, mapsReady, passengerCount, step, trackBookingStarted]);

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
          drivingOptions: {
            departureTime: bookingType === 'later' && scheduledDateTime ? new Date(scheduledDateTime) : new Date(),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
          },
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRenderer.current?.setDirections(result);
            map.fitBounds(result.routes[0].bounds);

            const route = result.routes?.[0];
            const leg = route?.legs?.[0];
            const warningsText = (route?.warnings || []).join(' ').toLowerCase();
            const steps = leg?.steps || [];
            const hasTolls =
              warningsText.includes('toll') ||
              steps.some((step) => {
                const instructions = (step.instructions || '').toLowerCase();
                return instructions.includes('toll') || instructions.includes('citylink') || instructions.includes('eastlink');
              });

            if (leg) {
              const distanceKm = (leg.distance?.value || 0) / 1000;
              const durationMinutes = ((leg.duration_in_traffic?.value || leg.duration?.value || 0) / 60);
              const fareRange = estimateFareRange({
                distanceKm,
                durationMin: durationMinutes,
                rideDate: bookingType === 'later' && scheduledDateTime ? new Date(scheduledDateTime) : new Date(),
                passengerCount: Number(passengerCount) || 1,
                airportPickup: isMelbourneAirport(pickupAddress),
                hasTolls,
                pickupSuburb,
                dropoffSuburb,
              });

              setRoutePreview({
                distanceText: leg.distance?.text || `${distanceKm.toFixed(1)} km`,
                durationText: leg.duration_in_traffic?.text || leg.duration?.text || `${Math.round(durationMinutes)} min`,
                tollsText: hasTolls ? 'Likely tolls on fastest route' : 'No obvious tolls detected',
                minFareText: fareRange ? `$${fareRange.minFare.toFixed(2)}` : '--',
                maxFareText: fareRange ? `$${fareRange.maxFare.toFixed(2)}` : '--',
                fareTypeText: fareRange ? `${fareRange.tariff.name} estimate` : 'Estimate',
                minFare: fareRange?.minFare ?? null,
                maxFare: fareRange?.maxFare ?? null,
                hasTolls,
              });
            }
          }
        }
      );
    }
  }, [bookingType, dropoffLoc, dropoffSuburb, map, passengerCount, pickupAddress, pickupLoc, pickupSuburb, scheduledDateTime]);

  useEffect(() => {
    const quoteReadyForTracking = Number(passengerCount) > 0 && (bookingType === 'now' || Boolean(scheduledDateTime));

    if (
      !routePreview?.minFare ||
      !routePreview?.maxFare ||
      !pickupAddress ||
      !dropoffAddress ||
      !quoteReadyForTracking
    ) {
      return;
    }

    const fareKey = [
      routePreview.minFare,
      routePreview.maxFare,
      pickupSuburb,
      dropoffSuburb,
      bookingType,
      pickupAddress,
      dropoffAddress,
    ].join(':');

    if (fareTrackedRef.current === fareKey) {
      return;
    }

    fareTrackedRef.current = fareKey;
    const ga4FareValue = Number(((routePreview.minFare + routePreview.maxFare) / 2).toFixed(2));
    fireSubmitGa4Event('fare_calculated', {
      value: ga4FareValue,
      currency: 'AUD',
      debug_mode: true,
    });
    trackAnalyticsEvent('fare_calculated', {
      stepName: 'vehicle_quote',
      estimatedFare: ga4FareValue,
      pickupSuburb: pickupSuburb || undefined,
      dropoffSuburb: dropoffSuburb || undefined,
      bookingType,
      passengerCount: Number(passengerCount) || undefined,
      isAirportPickup: isMelbourneAirport(pickupAddress),
      isAirportDropoff: isMelbourneAirport(dropoffAddress),
        metadata: {
          fareMin: routePreview.minFare,
          fareMax: routePreview.maxFare,
          fareType: routePreview.fareTypeText,
          hasTolls: routePreview.hasTolls,
        },
      });
  }, [
    bookingType,
    dropoffAddress,
    dropoffSuburb,
    fireSubmitGa4Event,
    passengerCount,
    pickupAddress,
    pickupSuburb,
    routePreview,
    scheduledDateTime,
  ]);

  const handlePassengerSubmit = (details) => {
    trackAnalyticsEvent('passenger_details_submitted', {
      stepName: 'passenger_details',
      bookingType,
      passengerCount: Number(passengerCount) || undefined,
      vehicleType: selectedVehicle?.id || null,
      estimatedFare: Number.isFinite(Number(fare)) ? Number(fare) : undefined,
      metadata: {
        hasEmail: Boolean(details?.email),
        hasPhone: Boolean(details?.phone),
      },
    });
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
      sessionToken: getOrCreateSessionToken(),
    };

    try {
      if (!submitAttemptTrackedRef.current) {
        submitAttemptTrackedRef.current = true;
        fireSubmitGa4Event('booking_submit_attempt', {
          debug_mode: true,
        });
      }

      trackAnalyticsEvent('booking_submit_attempt', {
        stepName: 'booking_submit',
        pickupSuburb: pickupSuburb || undefined,
        dropoffSuburb: dropoffSuburb || undefined,
        bookingType,
        passengerCount: Number(passengerCount) || undefined,
        vehicleType: selectedVehicle?.id || null,
        estimatedFare: Number.isFinite(Number(fare)) ? Number(fare) : undefined,
        bookingDateTime: rideDate.toISOString(),
      });

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

        if (!submitSuccessTrackedRef.current) {
          submitSuccessTrackedRef.current = true;
          fireSubmitGa4Event('booking_submit_success', {
            value: conversionValue,
            currency: 'AUD',
            debug_mode: true,
          });
        }

        trackAnalyticsEvent('booking_submit_success', {
          stepName: 'booking_submit',
          rideId: result?.id,
          pickupSuburb: pickupSuburb || undefined,
          dropoffSuburb: dropoffSuburb || undefined,
          bookingType,
          passengerCount: Number(passengerCount) || undefined,
          vehicleType: selectedVehicle?.id || null,
          estimatedFare: Number.isFinite(Number(result?.fare)) ? Number(result.fare) : conversionValue,
          bookingDateTime: rideDate.toISOString(),
          metadata: {
            rideId: result?.id,
            finalFare: result?.fare ?? fare,
          },
        });

        navigate('/ride-success', {
          state: {
            isGuest: !loggedInUser,
            bookingId: result?.id,
            totalFare: result?.fare ?? fare,
          },
        });
      } else {
        trackAnalyticsEvent('booking_submit_error', {
          stepName: 'booking_submit',
          errorType: res.status >= 500 ? 'server_error' : 'validation_error',
          pickupSuburb: pickupSuburb || undefined,
          dropoffSuburb: dropoffSuburb || undefined,
          bookingType,
          passengerCount: Number(passengerCount) || undefined,
          vehicleType: selectedVehicle?.id || null,
          estimatedFare: Number.isFinite(Number(fare)) ? Number(fare) : undefined,
          metadata: {
            errorType: res.status >= 500 ? 'server_error' : 'validation_error',
            message: result?.error || 'Booking failed.',
          },
        });
        toast.error(result.error ? `Booking failed: ${result.error}` : 'Booking failed.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      trackAnalyticsEvent('booking_submit_error', {
        stepName: 'booking_submit',
        errorType: 'network_error',
        pickupSuburb: pickupSuburb || undefined,
        dropoffSuburb: dropoffSuburb || undefined,
        bookingType,
        passengerCount: Number(passengerCount) || undefined,
        vehicleType: selectedVehicle?.id || null,
        estimatedFare: Number.isFinite(Number(fare)) ? Number(fare) : undefined,
        metadata: {
          errorType: 'network_error',
        },
      });
      toast.error('Error booking the ride.');
    }
  };

  useEffect(() => {
    submitAttemptTrackedRef.current = false;
    submitSuccessTrackedRef.current = false;
  }, [
    pickupAddress,
    dropoffAddress,
    pickupSuburb,
    dropoffSuburb,
    bookingType,
    scheduledDateTime,
    passengerCount,
    selectedVehicle?.id,
    fare,
    passengerDetails?.name,
    passengerDetails?.email,
    passengerDetails?.phone,
  ]);

  const phone = passengerDetails?.phone ?? '';
  const hasPassengerCount = Number(passengerCount) > 0;
  const hasScheduleSelection = bookingType === 'now' || Boolean(scheduledDateTime);
  const canContinueToVehicle = Boolean(pickupLoc && dropoffLoc && hasPassengerCount && hasScheduleSelection);

  useEffect(() => {
    const justEnteredPassengerCount = hasPassengerCount && !prevHasPassengerCountRef.current;

    if (justEnteredPassengerCount && canContinueToVehicle && routePreview && tripEstimateRef.current) {
      tripEstimateRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    prevHasPassengerCountRef.current = hasPassengerCount;
  }, [canContinueToVehicle, hasPassengerCount, routePreview]);

  useEffect(() => {
    if (!selectedVehicle?.id || !Number.isFinite(Number(fare))) {
      return;
    }

    const vehicleKey = [
      selectedVehicle.id,
      pickupAddress,
      dropoffAddress,
      bookingType,
      scheduledDateTime || 'now',
    ].join(':');
    if (vehicleTrackedRef.current === vehicleKey) {
      return;
    }

    vehicleTrackedRef.current = vehicleKey;
    fireSubmitGa4Event('vehicle_selected', {
      vehicle_type: selectedVehicle.id,
      debug_mode: true,
    });
    trackAnalyticsEvent('vehicle_selected', {
      stepName: 'vehicle_selection',
      vehicleType: selectedVehicle.id,
      estimatedFare: Number(fare),
      pickupSuburb: pickupSuburb || undefined,
      dropoffSuburb: dropoffSuburb || undefined,
      bookingType,
      passengerCount: Number(passengerCount) || undefined,
      metadata: {
        vehicleName: selectedVehicle.name || selectedVehicle.id,
      },
    });
  }, [
    bookingType,
    dropoffAddress,
    fireSubmitGa4Event,
    pickupAddress,
    pickupSuburb,
    scheduledDateTime,
    selectedVehicle,
    dropoffSuburb,
    fare,
    passengerCount,
  ]);

  const handleContinueToVehicle = () => {
    trackBookingStarted();
    if (!pickupLoc || !dropoffLoc) {
      toast.error('Select pickup and dropoff first.');
      return;
    }

    if (!hasPassengerCount) {
      toast.error('Select the number of passengers before continuing.');
      return;
    }

    if (!hasScheduleSelection) {
      toast.error('Select the date and time before continuing.');
      return;
    }

    setStep(2);
  };

  const maxStepAllowed = useMemo(() => {
    let max = 1;
    if (canContinueToVehicle) max = 2;
    if (pickupLoc && dropoffLoc && selectedVehicle) max = 3;
    if (pickupLoc && dropoffLoc && selectedVehicle && passengerDetails) {
      max = 4;
    }
    return max;
  }, [canContinueToVehicle, pickupLoc, dropoffLoc, selectedVehicle, passengerDetails]);

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

            {canContinueToVehicle && routePreview ? (
              <div
                ref={tripEstimateRef}
                className="mb-4 scroll-mt-28 rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#eef2ff_100%)] px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Trip Estimate</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {bookingType === 'later' ? 'Scheduled quote snapshot' : 'Live quote snapshot'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                      {routePreview.fareTypeText}
                    </span>
                    {Number(passengerCount) > 4 ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
                        High occupancy
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Approx Fare</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">
                    {routePreview.minFareText}
                    {routePreview.maxFareText !== routePreview.minFareText ? ` - ${routePreview.maxFareText}` : ''}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Trip Distance</p>
                    <p className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">{routePreview.distanceText}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Trip Time</p>
                    <p className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">{routePreview.durationText}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5">
                    {Number(passengerCount)} passenger{Number(passengerCount) === 1 ? '' : 's'}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5">
                    {routePreview.tollsText}
                  </span>
                </div>
              </div>
            ) : null}

            <button
              onClick={handleContinueToVehicle}
              className={`h-11 w-full rounded-xl font-semibold text-white transition ${
                canContinueToVehicle ? 'bg-gray-900 hover:bg-black' : 'bg-gray-500 hover:bg-gray-600'
              }`}
              title={
                !pickupLoc || !dropoffLoc
                  ? 'Select pickup and dropoff first'
                  : !hasPassengerCount
                  ? 'Select the number of passengers first'
                  : !hasScheduleSelection
                  ? 'Choose a date and time for later bookings'
                  : 'Next'
              }
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
            pickupSuburb={pickupSuburb}
            dropoffSuburb={dropoffSuburb}
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
