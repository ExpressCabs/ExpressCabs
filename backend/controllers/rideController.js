// rideController.js - Logic for handling ride bookings
// controllers/rideController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bookRide = async (req, res) => {
  try {
    const ride = await prisma.ride.create({
      data: req.body
    });
    res.status(201).json(ride);
  } catch (error) {
    console.error('Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  }
};

module.exports = { bookRide };
