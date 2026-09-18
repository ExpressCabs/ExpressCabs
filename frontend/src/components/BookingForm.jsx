import React, { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { MdCalendarToday, MdMyLocation } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { fireBookingConversion } from '../lib/adsTracking';
import { trackAnalyticsEvent } from '../lib/tracking/events';
import { getOrCreateSessionToken } from '../lib/tracking/session';
import { estimateFareRange, isMelbourneAirport } from '../lib/ridePricing';
import { toast } from './ToastProvider';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';
import { useGoogleMapsReady } from '../utils/useGoogleMapsReady';

const VehicleSelection = lazy(() => import('../screens/VehicleSelection'));
const PassengerDetails = lazy(() => import('../screens/PassengerDetails'));
const OTPVerification = lazy(() => import('../screens/OTPVerification'));
const SITE_KEY = import.meta.env.VITE_ANALYTICS_SITE_KEY || 'prime_cabs_melbourne';

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
  const passengerCountInputRef = useRef(null);
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
  const pickupAddressSyncRef = useRef({ value: '', source: 'idle' });

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
  const [passengerDetails, setPassengerDetails] = useState({
    name: loggedInUser?.name || '',
    phone: loggedInUser?.phone || '',
    email: loggedInUser?.email || '',
    note: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showExtras, setShowExtras] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const [routePreview, setRoutePreview] = useState(null);
  const [isResolvingCurrentLocation, setIsResolvingCurrentLocation] = useState(false);
  const [currentLocationError, setCurrentLocationError] = useState('');

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

  const createMarker = useCallback(({ location, targetMap, markerRef, label, fillColor }) => {
    if (!window.google?.maps || !location || !targetMap) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.google.maps.Marker({
      position: location,
      map: targetMap,
      label: { text: label, color: '#ffffff', fontWeight: '700' },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        scale: 11,
      },
    });
  }, []);

  const applyPickupSelection = useCallback(({ location, address, place, targetMap, recenter = true }) => {
    if (!location) {
      return;
    }

    const activeMap = targetMap || map;
    const resolvedAddress = address || place?.formatted_address || place?.name || '';
    const resolvedSuburb = extractSuburbFromPlace(place || { formatted_address: resolvedAddress });

    createMarker({
      location,
      targetMap: activeMap,
      markerRef: pickupMarker,
      label: 'P',
      fillColor: '#0f172a',
    });

    setPickupLoc(location);
    setPickupAddress(resolvedAddress);
    setPickupSuburb(resolvedSuburb);
    pickupAddressSyncRef.current = {
      value: resolvedAddress,
      source: place?.geometry ? 'place' : 'geocode',
    };

    if (activeMap && recenter) {
      activeMap.setCenter(location);
    }
  }, [createMarker, extractSuburbFromPlace, map]);

  const applyDropoffSelection = useCallback(({ location, address, place, targetMap, recenter = true }) => {
    if (!location) {
      return;
    }

    const activeMap = targetMap || map;
    const resolvedAddress = address || place?.formatted_address || place?.name || '';
    const resolvedSuburb = extractSuburbFromPlace(place || { formatted_address: resolvedAddress });

    createMarker({
      location,
      targetMap: activeMap,
      markerRef: dropoffMarker,
      label: 'D',
      fillColor: '#2563eb',
    });

    setDropoffLoc(location);
    setDropoffAddress(resolvedAddress);
    setDropoffSuburb(resolvedSuburb);

    if (activeMap && recenter) {
      activeMap.setCenter(location);
    }
  }, [createMarker, extractSuburbFromPlace, map]);

  const focusDropoffInput = useCallback(() => {
    const focusInput = () => {
      dropoffInputRef.current?.focus();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focusInput);
      return;
    }

    setTimeout(focusInput, 0);
  }, []);

  const focusPassengerCountInput = useCallback(() => {
    const focusInput = () => {
      passengerCountInputRef.current?.focus();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focusInput);
      return;
    }

    setTimeout(focusInput, 0);
  }, []);

  const initMapAndAutocomplete = useCallback(() => {
    if (gmapsInitRef.current) return map;
    if (step === 4) return null;
    if (!window.google?.maps?.Map || !window.google?.maps?.places?.Autocomplete) return null;
    if (!mapRef.current || !pickupInputRef.current || !dropoffInputRef.current) return null;

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
        const resolvedAddress = place.formatted_address || place.name || '';
        applyPickupSelection({
          location,
          address: resolvedAddress,
          place,
          targetMap: gMap,
        });
        focusDropoffInput();
        const pickupSuburb = extractSuburbFromPlace(place);

        const eventKey = `${pickupSuburb}:${resolvedAddress}`;
        if (pickupTrackedRef.current !== eventKey) {
          pickupTrackedRef.current = eventKey;
          fireSubmitGa4Event('pickup_entered', {
            pickup_suburb: pickupSuburb,
            debug_mode: true,
          });
          trackAnalyticsEvent('pickup_entered', {
            stepName: 'address_entry',
            pickupSuburb,
            isAirportPickup: isMelbourneAirport(resolvedAddress),
            bookingType,
            passengerCount: Number(passengerCount) || undefined,
            metadata: {
              pickupAddress: resolvedAddress,
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
        const resolvedAddress = place.formatted_address || place.name || '';
        applyDropoffSelection({
          location,
          address: resolvedAddress,
          place,
          targetMap: gMap,
        });
        const dropoffSuburb = extractSuburbFromPlace(place);

        const eventKey = `${dropoffSuburb}:${resolvedAddress}`;
        if (dropoffTrackedRef.current !== eventKey) {
          dropoffTrackedRef.current = eventKey;
          fireSubmitGa4Event('dropoff_entered', {
            dropoff_suburb: dropoffSuburb,
            debug_mode: true,
          });
          trackAnalyticsEvent('dropoff_entered', {
            stepName: 'address_entry',
            dropoffSuburb,
            isAirportDropoff: isMelbourneAirport(resolvedAddress),
            bookingType,
            passengerCount: Number(passengerCount) || undefined,
            metadata: {
              dropoffAddress: resolvedAddress,
            },
          });
        }
      }
    });

    return gMap;
  }, [
    applyDropoffSelection,
    applyPickupSelection,
    bookingType,
    extractSuburbFromPlace,
    focusDropoffInput,
    map,
    passengerCount,
    step,
    trackBookingStarted,
  ]);

  const getCurrentLocationErrorMessage = useCallback((error) => {
    if (!error) {
      return 'We could not detect your location. Please try again or enter the address manually.';
    }

    if (error?.code === 'unsupported') {
      return 'Location is not supported on this device or browser.';
    }

    if (error?.code === 1) {
      return 'Location permission was denied. You can still enter the pickup address manually.';
    }

    if (error?.code === 2 || error?.code === 3) {
      return 'We could not detect your location. Please try again or enter the address manually.';
    }

    return 'We could not use your current location right now. Please enter the pickup address manually.';
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    trackBookingStarted();
    setCurrentLocationError('');
    setIsResolvingCurrentLocation(true);

    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw { code: 'unsupported' };
      }

      if (!mapsEnabled) {
        setMapsEnabled(true);
      }

      const googleMapsPromise = loadGoogleMaps();
      const positionPromise = new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          // Prioritize a fast fix so the field and marker update immediately after permission is granted.
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000,
        });
      });
      const position = await positionPromise;

      await googleMapsPromise;
      const initializedMap = initMapAndAutocomplete();
      const activeMap = initializedMap || map;

      const latitude = position?.coords?.latitude;
      const longitude = position?.coords?.longitude;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Invalid coordinates returned from geolocation.');
      }

      const location = new window.google.maps.LatLng(latitude, longitude);
      const geocoder = new window.google.maps.Geocoder();
      const quickAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      applyPickupSelection({
        location,
        address: quickAddress,
        place: { formatted_address: quickAddress },
        targetMap: activeMap,
      });

      let address = 'Current location selected';
      let geocodePlace = { formatted_address: address };

      try {
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (geocodeResults, status) => {
            if (status === 'OK') {
              resolve(geocodeResults || []);
              return;
            }
            reject(new Error(status || 'GEOCODER_FAILED'));
          });
        });

        if (results[0]?.formatted_address) {
          address = results[0].formatted_address;
          geocodePlace = results[0];
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed for current location:', geocodeError);
      }

      applyPickupSelection({
        location,
        address,
        place: geocodePlace,
        targetMap: activeMap,
      });

      if (activeMap) {
        activeMap.setCenter(location);
        if ((activeMap.getZoom?.() || 0) < 15) {
          activeMap.setZoom(15);
        }
      }
    } catch (error) {
      setCurrentLocationError(getCurrentLocationErrorMessage(error));
    } finally {
      setIsResolvingCurrentLocation(false);
    }
  }, [
    applyPickupSelection,
    getCurrentLocationErrorMessage,
    initMapAndAutocomplete,
    map,
    mapsEnabled,
    trackBookingStarted,
  ]);

  useEffect(() => {
    if (step === 4 || !mapsReady) return;

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
    if (step === 4) {
      gmapsInitRef.current = false;
    }
  }, [step]);

  useEffect(() => {
    if (!map || !pickupLoc || !window.google?.maps) {
      return;
    }

    createMarker({
      location: pickupLoc,
      targetMap: map,
      markerRef: pickupMarker,
      label: 'P',
      fillColor: '#0f172a',
    });

    map.panTo(pickupLoc);
  }, [createMarker, map, pickupLoc]);

  useEffect(() => {
    if (!map || !dropoffLoc || !window.google?.maps) {
      return;
    }

    createMarker({
      location: dropoffLoc,
      targetMap: map,
      markerRef: dropoffMarker,
      label: 'D',
      fillColor: '#2563eb',
    });
  }, [createMarker, dropoffLoc, map]);

  useEffect(() => {
    if (step === 4 || !mapsEnabled || !pickupAddress.trim()) {
      return;
    }

    const trimmedAddress = pickupAddress.trim();
    if (trimmedAddress.length < 4) {
      return;
    }

    if (pickupAddressSyncRef.current.value === trimmedAddress) {
      if (pickupAddressSyncRef.current.source !== 'typing') {
        pickupAddressSyncRef.current = { value: trimmedAddress, source: 'idle' };
      }
      return;
    }

    pickupAddressSyncRef.current = { value: trimmedAddress, source: 'typing' };

    const timeoutId = window.setTimeout(async () => {
      try {
        await loadGoogleMaps();
        const initializedMap = initMapAndAutocomplete();
        const activeMap = initializedMap || map;

        if (!window.google?.maps?.Geocoder || !activeMap) {
          return;
        }

        const geocoder = new window.google.maps.Geocoder();
        const results = await new Promise((resolve, reject) => {
          geocoder.geocode(
            {
              address: trimmedAddress,
              componentRestrictions: { country: 'AU' },
            },
            (geocodeResults, status) => {
              if (status === 'OK' && geocodeResults?.length) {
                resolve(geocodeResults);
                return;
              }
              reject(new Error(status || 'GEOCODER_FAILED'));
            }
          );
        });

        if (pickupAddressSyncRef.current.value !== trimmedAddress || pickupAddressSyncRef.current.source !== 'typing') {
          return;
        }

        const [firstResult] = results;
        if (firstResult?.geometry?.location) {
          applyPickupSelection({
            location: firstResult.geometry.location,
            address: trimmedAddress,
            place: firstResult,
            targetMap: activeMap,
            recenter: true,
          });
        }
      } catch (error) {
        if (pickupAddressSyncRef.current.value === trimmedAddress && pickupAddressSyncRef.current.source === 'typing') {
          pickupAddressSyncRef.current = { value: trimmedAddress, source: 'idle' };
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applyPickupSelection, initMapAndAutocomplete, map, mapsEnabled, pickupAddress, step]);

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
      siteKey: SITE_KEY,
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
        const message = result.error ? `Booking failed: ${result.error}` : 'Booking failed.';
        setFieldErrors((current) => ({ ...current, submit: message }));
        toast.error(message);
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
      setFieldErrors((current) => ({ ...current, submit: 'We could not submit your booking. Check your connection and try again.' }));
      toast.error('Error booking the ride.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassengerSubmit = (details) => {
    setPassengerDetails(details);
    setStep(4);
  };

  const handleSingleSubmit = (event) => {
    event?.preventDefault?.();
    trackBookingStarted();

    const errors = {};
    if (!pickupLoc) errors.pickup = 'Choose a pickup address from the suggestions.';
    if (!dropoffLoc) errors.dropoff = 'Choose a destination from the suggestions.';
    if (!hasPassengerCount) errors.passengerCount = 'Enter the number of passengers.';
    if (bookingType === 'later' && !scheduledDateTime) errors.scheduledDateTime = 'Choose a pickup date and time.';
    if (!selectedVehicle) errors.vehicle = 'Select a vehicle that fits your group.';
    if (!passengerDetails.name.trim()) errors.name = 'Enter the passenger name.';
    if (!passengerDetails.phone.trim()) errors.phone = 'Enter a phone number.';
    if (passengerDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerDetails.email)) {
      errors.email = 'Enter a valid email address or leave it blank.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    trackAnalyticsEvent('passenger_details_submitted', {
      stepName: 'passenger_details',
      bookingType,
      passengerCount: Number(passengerCount) || undefined,
      vehicleType: selectedVehicle?.id || null,
      estimatedFare: Number.isFinite(Number(fare)) ? Number(fare) : undefined,
      metadata: {
        hasEmail: Boolean(passengerDetails.email),
        hasPhone: Boolean(passengerDetails.phone),
      },
    });

    if (OTP_ENABLED) {
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    handleBookRide();
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
      className="mt-4 h-64 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left shadow-sm"
      aria-label="Activate live map"
    >
      <div className="relative h-full w-full">
        <img
          src="/assets/images/map.webp"
          alt="Melbourne route map preview"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.18)_100%)]" />
      </div>
    </button>
  );

  const stepFallback = (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
      Loading...
    </div>
  );

  const legacyContent = (
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
            <div className="relative mb-3" aria-live="polite">
              <input
                ref={pickupInputRef}
                type="text"
                placeholder="Pickup address"
                value={pickupAddress}
                onChange={(e) => {
                  setPickupAddress(e.target.value);
                  if (currentLocationError) {
                    setCurrentLocationError('');
                  }
                }}
                onFocus={handleMapIntent}
                onChangeCapture={handleMapIntent}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 pr-12 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={isResolvingCurrentLocation}
                aria-label={isResolvingCurrentLocation ? 'Detecting current location' : 'Use current location'}
                title={isResolvingCurrentLocation ? 'Detecting location...' : 'Use my current location'}
              >
                <MdMyLocation size={18} />
              </button>
              {currentLocationError ? (
                <p className="mt-1 text-xs font-medium text-red-600">{currentLocationError}</p>
              ) : null}
            </div>
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setScheduledDateTime(value);

                          if (value && !Number.isNaN(new Date(value).getTime())) {
                            focusPassengerCountInput();
                          }
                        }}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                        placeholder="Select date and time"
                      />
                    </label>
                  </div>
                )}

                <div>
                  <input
                    ref={passengerCountInputRef}
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
                    {/*
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                      {routePreview.fareTypeText}
                    </span>
                    */}
                    {Number(passengerCount) > 4 ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">
                        High occupancy
                      </span>
                    ) : null}
                  </div>
                </div>

                {/*
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Approx Fare On Meter Will Be</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">
                    {routePreview.minFareText}
                    {routePreview.maxFareText !== routePreview.minFareText ? ` - ${routePreview.maxFareText}` : ''}
                  </p>
                </div>
                */}

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

  const inputClass = (name) => `mt-2 h-12 w-full rounded-xl border bg-white px-3 text-base text-slate-950 outline-none transition focus:ring-2 ${
    fieldErrors[name] ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-slate-700 focus:ring-slate-200'
  }`;
  const updatePassengerDetail = (name, value) => {
    setPassengerDetails((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  };
  const errorText = (name) => fieldErrors[name] ? (
    <p id={`${name}-error`} className="mt-1 text-sm font-medium text-red-700">{fieldErrors[name]}</p>
  ) : null;

  const content = step === 4 && OTP_ENABLED ? (
    <Suspense fallback={stepFallback}>
      <OTPVerification
        setStep={setStep}
        phone={phone}
        onSuccess={() => { setIsSubmitting(true); handleBookRide(); }}
        onBack={() => setStep(1)}
      />
    </Suspense>
  ) : (
    <form onSubmit={handleSingleSubmit} noValidate className="text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Fast, secure, 24/7</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Book your ride</h2>
          <p className="mt-1 text-sm text-slate-600">One quick form. We’ll confirm your booking straight away.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">No account needed</span>
      </div>

      <fieldset className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <legend className="px-1 text-base font-extrabold">Your journey</legend>
        <div className="relative">
          <label htmlFor="booking-pickup" className="text-sm font-semibold">Pickup address *</label>
          <input
            id="booking-pickup" ref={pickupInputRef} type="text" autoComplete="street-address"
            value={pickupAddress}
            onChange={(event) => {
              setPickupAddress(event.target.value);
              setPickupLoc(null);
              setFieldErrors((current) => ({ ...current, pickup: undefined, submit: undefined }));
              if (currentLocationError) setCurrentLocationError('');
            }}
            onFocus={handleMapIntent} onChangeCapture={handleMapIntent}
            aria-invalid={Boolean(fieldErrors.pickup)} aria-describedby={fieldErrors.pickup ? 'pickup-error' : undefined}
            className={`${inputClass('pickup')} pr-12`} placeholder="Start typing an address"
          />
          <button
            type="button" onClick={handleUseCurrentLocation} disabled={isResolvingCurrentLocation}
            className="absolute right-2 top-[34px] inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:text-slate-400"
            aria-label={isResolvingCurrentLocation ? 'Detecting current location' : 'Use current location'}
          ><MdMyLocation size={19} /></button>
          {errorText('pickup')}
          {currentLocationError && <p className="mt-1 text-sm font-medium text-red-700">{currentLocationError}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor="booking-dropoff" className="text-sm font-semibold">Destination *</label>
          <input
            id="booking-dropoff" ref={dropoffInputRef} type="text" autoComplete="off" value={dropoffAddress}
            onChange={(event) => {
              setDropoffAddress(event.target.value);
              setDropoffLoc(null);
              setFieldErrors((current) => ({ ...current, dropoff: undefined, submit: undefined }));
            }}
            onFocus={handleMapIntent} onChangeCapture={handleMapIntent}
            aria-invalid={Boolean(fieldErrors.dropoff)} aria-describedby={fieldErrors.dropoff ? 'dropoff-error' : undefined}
            className={inputClass('dropoff')} placeholder="Where are you going?"
          />
          {errorText('dropoff')}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm font-semibold">Pickup time *</span>
            <div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Pickup time">
              {['now', 'later'].map((value) => (
                <label key={value} className={`cursor-pointer rounded-lg px-2 py-2 text-center text-sm font-semibold ${bookingType === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}>
                  <input type="radio" name="bookingType" value={value} checked={bookingType === value} onChange={() => { setBookingType(value); if (value === 'now') setScheduledDateTime(''); }} className="sr-only" />
                  {value === 'now' ? 'As soon as possible' : 'Schedule'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="passenger-count" className="text-sm font-semibold">Passengers *</label>
            <input
              id="passenger-count" ref={passengerCountInputRef} type="number" inputMode="numeric" min="1" max="11" value={passengerCount || ''}
              onChange={(event) => {
                const value = parseInt(event.target.value, 10);
                setPassengerCount(Number.isNaN(value) ? '' : value);
                setSelectedVehicle(null);
                setFieldErrors((current) => ({ ...current, passengerCount: undefined, vehicle: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.passengerCount)} aria-describedby={fieldErrors.passengerCount ? 'passengerCount-error' : undefined}
              className={inputClass('passengerCount')} placeholder="e.g. 2"
            />
            {errorText('passengerCount')}
          </div>
        </div>

        {bookingType === 'later' && <div className="mt-4">
          <label htmlFor="scheduledDateTime" className="flex items-center gap-2 text-sm font-semibold"><MdCalendarToday /> Pickup date and time *</label>
          <input
            id="scheduledDateTime" type="datetime-local" value={scheduledDateTime}
            onChange={(event) => { setScheduledDateTime(event.target.value); setFieldErrors((current) => ({ ...current, scheduledDateTime: undefined })); }}
            aria-invalid={Boolean(fieldErrors.scheduledDateTime)} aria-describedby={fieldErrors.scheduledDateTime ? 'scheduledDateTime-error' : undefined}
            className={inputClass('scheduledDateTime')}
          />
          {errorText('scheduledDateTime')}
        </div>}

        {routePreview && <div ref={tripEstimateRef} className="mt-4 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700" aria-live="polite">
          <span className="font-bold text-slate-950">Trip estimate</span>
          <span>{routePreview.distanceText}</span><span aria-hidden="true">•</span><span>{routePreview.durationText}</span><span aria-hidden="true">•</span><span>{routePreview.tollsText}</span>
        </div>}

        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700">Preview route map</summary>
          <div className="px-3 pb-3">
            {!mapsReady || !mapInitialized ? <MapPlaceholder /> : null}
            <div ref={mapRef} className={`${mapsReady && mapInitialized ? 'block' : 'hidden'} mt-3 h-56 overflow-hidden rounded-xl border border-slate-200`} aria-label="Route map" />
          </div>
        </details>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <legend className="px-1 text-base font-extrabold">Choose a vehicle *</legend>
        <p className="mb-4 text-sm text-slate-600">Options update when your route and passenger count are ready.</p>
        {canContinueToVehicle ? <Suspense fallback={stepFallback}>
          <VehicleSelection
            inline pickupLoc={pickupLoc} dropoffLoc={dropoffLoc} pickupSuburb={pickupSuburb} dropoffSuburb={dropoffSuburb}
            passengerCount={passengerCount} bookingType={bookingType} scheduledDateTime={scheduledDateTime}
            setStep={setStep} setSelectedVehicle={(vehicle) => { setSelectedVehicle(vehicle); setFieldErrors((current) => ({ ...current, vehicle: undefined })); }}
            setFare={setFare} setFareType={setFareType} setMap={setMap}
          />
        </Suspense> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Add your journey details above to see suitable vehicles.</p>}
        {errorText('vehicle')}
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <legend className="px-1 text-base font-extrabold">Contact details</legend>
        <p className="mb-4 text-sm text-slate-600">Your driver will use these details for this booking.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="passenger-name" className="text-sm font-semibold">Full name *</label>
            <input id="passenger-name" type="text" autoComplete="name" value={passengerDetails.name} onChange={(event) => updatePassengerDetail('name', event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'name-error' : undefined} className={inputClass('name')} />
            {errorText('name')}
          </div>
          <div>
            <label htmlFor="passenger-phone" className="text-sm font-semibold">Mobile number *</label>
            <input id="passenger-phone" type="tel" inputMode="tel" autoComplete="tel" value={passengerDetails.phone} onChange={(event) => updatePassengerDetail('phone', event.target.value)} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} className={inputClass('phone')} placeholder="04xx xxx xxx" />
            {errorText('phone')}
          </div>
        </div>

        <button type="button" onClick={() => setShowExtras((value) => !value)} aria-expanded={showExtras} className="mt-4 text-sm font-bold text-slate-700 underline decoration-slate-300 underline-offset-4">
          {showExtras ? 'Hide optional details' : 'Add email or booking notes'}
        </button>
        {showExtras && <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="passenger-email" className="text-sm font-semibold">Email <span className="font-normal text-slate-500">(optional)</span></label>
            <input id="passenger-email" type="email" autoComplete="email" value={passengerDetails.email} onChange={(event) => updatePassengerDetail('email', event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} className={inputClass('email')} placeholder="you@example.com" />
            {errorText('email')}
          </div>
          <div>
            <label htmlFor="passenger-note" className="text-sm font-semibold">Notes for the driver <span className="font-normal text-slate-500">(optional)</span></label>
            <textarea id="passenger-note" value={passengerDetails.note} onChange={(event) => updatePassengerDetail('note', event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200" placeholder="Flight number, luggage, child seat or pickup instructions" />
          </div>
        </div>}
      </fieldset>

      {fieldErrors.submit && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{fieldErrors.submit}</p>}
      <button type="submit" disabled={isSubmitting} className="mt-5 h-12 w-full rounded-xl bg-slate-950 px-5 text-base font-extrabold text-white shadow-lg transition hover:bg-black focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-wait disabled:opacity-65">
        {isSubmitting ? 'Booking your ride…' : 'Book my ride'}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">You’ll receive confirmation after your booking is submitted.</p>
    </form>
  );

  if (embedded) return content;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_42%,#e2e8f0_100%)] p-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/45 bg-white/70 p-4 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl md:p-7">
        {content}
      </div>
    </div>
  );
};

export default BookingForm;
