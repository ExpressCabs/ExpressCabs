import React, { useEffect, useRef, useState } from 'react';
import HeaderFooter from '../components/HeaderFooter';
import VehicleSelection from './VehicleSelection';
import PassengerDetails from './PassengerDetails';

const AddressScreen = () => {
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

    const gMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 13,
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
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );
    }
  }, [pickupLoc, dropoffLoc, map]);

  const handlePassengerSubmit = (details) => {
    setPassengerDetails(details);
    console.log('Ready to submit full booking:', {
      pickupLoc,
      dropoffLoc,
      passengerCount,
      bookingType,
      scheduledDateTime,
      selectedVehicle,
      passengerDetails: details,
    });
  };

  return (
    <div className="relative flex flex-col h-screen">
      <HeaderFooter />

      <div className={step === 1 ? '' : 'hidden'}>
        <div className="pt-2 px-2 pb-4 bg-white shadow z-10">
          <h1 className="text-xl font-bold mb-3">Enter Pickup & Dropoff</h1>
          <input
            type="text"
            placeholder="Pickup address"
            ref={pickupInputRef}
            className="w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            placeholder="Dropoff address"
            ref={dropoffInputRef}
            className="w-full p-2 mb-2 border rounded"
          />

          {showBookingOptions && (
            <div className="mt-4 bg-gray-50 p-4 rounded shadow space-y-4">
              <div>
                <label className="block font-medium mb-1">Book for:</label>
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

              <div>
                <label className="block font-medium mb-1">Number of Passengers:</label>
                <input
                  type="number"
                  min="1"
                  max="11"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              {bookingType === 'later' && (
                <div>
                  <label className="block font-medium mb-1">Select Date & Time:</label>
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
                    className="w-full p-2 border rounded"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  className={`w-full py-2 px-4 rounded text-white font-semibold ${(bookingType === 'now' || (bookingType === 'later' && scheduledDateTime)) && passengerCount
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  disabled={
                    !pickupLoc ||
                    !dropoffLoc ||
                    !passengerCount ||
                    (bookingType === 'later' && !scheduledDateTime)
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div ref={mapRef} id="map" className="flex-1 z-0 min-h-[500px]" />
        <div className="h-20" />
      </div>

      <div className={step === 2 ? '' : 'hidden'}>
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
      </div>

      <div className={step === 3 ? '' : 'hidden'}>
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
        />

      </div>
    </div>
  );
};

export default AddressScreen;
