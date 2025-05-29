// controllers/rideController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bookRide = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      note,
      pickup,
      pickupLat,
      pickupLng,
      dropoff,
      dropoffLat,
      dropoffLng,
      rideDate,
      passengerCount,
      vehicleType,
      fare,
      fareType
    } = req.body;

    if (
      !name || !phone || !pickup || pickupLat == null || pickupLng == null ||
      !dropoff || dropoffLat == null || dropoffLng == null || !rideDate ||
      passengerCount == null || !vehicleType || fare == null || !fareType
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }


    const ride = await prisma.ride.create({
      data: {
        name,
        phone,
        email,
        note,
        pickup,
        pickupLat,
        pickupLng,
        dropoff,
        dropoffLat,
        dropoffLng,
        rideDate: new Date(rideDate),
        passengerCount,
        vehicleType,
        fare,
        fareType
      }
    });

    res.status(201).json(ride);
  } catch (error) {
    console.error('Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  }
};

module.exports = { bookRide };
