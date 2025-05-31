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


// Controller to get assigned rides for a specific driver
const getAssignedRides = async (req, res) => {
  const { driverId } = req.query;

  if (!driverId) {
    return res.status(400).json({ error: 'driverId is required' });
  }

  try {
    const rides = await prisma.ride.findMany({
      where: {
        driverId: parseInt(driverId),
      },
      orderBy: {
        rideDate: 'asc',
      },
    });

    res.json(rides);
  } catch (error) {
    console.error('❌ Error fetching assigned rides:', error);
    res.status(500).json({ error: 'Failed to fetch assigned rides' });
  }
};

const getUnassignedRides = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        driverId: null, // fetch only unassigned
      },
      orderBy: {
        rideDate: 'asc',
      },
    });

    console.log('✅ Unassigned rides fetched:', rides.length); // Debug line
    res.json(rides);
  } catch (error) {
    console.error('❌ Failed to fetch unassigned rides:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned rides' });
  }
};


const assignRideToDriver = async (req, res) => {
  const rideId = parseInt(req.params.id);
  const { driverId } = req.body;

  if (!driverId) {
    return res.status(400).json({ error: 'Driver ID is required.' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found.' });
    }

    if (ride.driverId) {
      return res.status(409).json({ error: 'Ride is already assigned.' });
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { driverId },
    });

    res.json({ message: 'Ride assigned successfully.', ride: updatedRide });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign ride.' });
  }
};

const unassignRideFromDriver = async (req, res) => {
  const rideId = parseInt(req.params.id);
  const { driverId } = req.body;

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride || ride.driverId !== driverId) {
      return res.status(403).json({ error: 'You are not allowed to unassign this ride.' });
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { driverId: null },
    });

    res.json({ message: 'Ride unassigned successfully.', ride: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unassign ride.' });
  }
};



module.exports = {
  bookRide,
  getAssignedRides,
  getUnassignedRides,
  assignRideToDriver,
  unassignRideFromDriver
};
