// controllers/rideController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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
      fareType,
      userId
    } = req.body;

    if (
      !name || !phone || !pickup || pickupLat == null || pickupLng == null ||
      !dropoff || dropoffLat == null || dropoffLng == null || !rideDate ||
      passengerCount == null || !vehicleType || fare == null || !fareType
    ) {
      console.warn('⚠️ Missing required fields');
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
        fareType,
        userId: userId || null,
      }
    });

    const formatMelbourneTime = (dateInput) => {
      const d = new Date(dateInput);
      return new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Melbourne",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    };

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Express Cabs" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: '-- New Ride Booking Received --',
        html: `
          <h2>New Ride Booking</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email || 'N/A'}</p>
          <p><strong>Pickup:</strong> ${pickup}</p>
          <p><strong>Dropoff:</strong> ${dropoff}</p>
          <p><strong>Date & Time:</strong> ${formatMelbourneTime(rideDate)}</p>
          <p><strong>Passengers:</strong> ${passengerCount}</p>
          <p><strong>Vehicle:</strong> ${vehicleType}</p>
          <p><strong>Fare:</strong> $${fare.toFixed(2)} (${fareType})</p>
          ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        `,
      });
    } catch (emailErr) {
      console.error('❌ Failed to send booking email:', emailErr);
    }

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+61${phone.replace(/^0/, '')}`;
      const smsText =
        `Hi ${name},\n` +
        `Your Express Cabs ride has been booked.\n\n` +
        `From: ${pickup}\n` +
        `To: ${dropoff}\n` +
        `Time: ${formatMelbourneTime(rideDate)}\n` +
        `Vehicle: ${vehicleType} (${passengerCount} passengers)\n` +
        `Fare: $${fare.toFixed(2)}\n\n` +
        `Need help? Call 0488 797 233`;

      await client.messages.create({ from: process.env.TWILIO_PHONE_NUMBER, to: formattedPhone, body: smsText });
    } catch (smsErr) {
      console.error('❌ Failed to send booking SMS:', smsErr);
    }

    res.status(201).json(ride);
  } catch (error) {
    console.error('❌ Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  }
};

const getAssignedRides = async (req, res) => {
  const { driverId } = req.query;
  if (!driverId) return res.status(400).json({ error: 'driverId is required' });
  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: parseInt(driverId) },
      orderBy: { rideDate: 'asc' },
    });
    res.json(rides);
  } catch (error) {
    console.error('❌ Error fetching assigned rides:', error);
    res.status(500).json({ error: 'Failed to fetch assigned rides' });
  }
};

const getUnassignedRides = async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({ where: { driverId: null }, orderBy: { rideDate: 'asc' } });
    res.json(rides);
  } catch (error) {
    console.error('❌ Failed to fetch unassigned rides:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned rides' });
  }
};

const assignRideToDriver = async (req, res) => {
  const rideId = parseInt(req.params.id);
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ error: 'Driver ID is required.' });

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ error: 'Ride not found.' });
    if (ride.driverId) return res.status(409).json({ error: 'Ride is already assigned.' });

    const updatedRide = await prisma.ride.update({ where: { id: rideId }, data: { driverId } });

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

    const phone = ride.phone.startsWith('+') ? ride.phone : `+61${ride.phone.replace(/^0/, '')}`;
    const smsText =
      `Hi ${ride.name},\n` +
      `A driver has been assigned to your Express Cabs ride.\n\n` +
      `From: ${ride.pickup}\n` +
      `To: ${ride.dropoff}\n` +
      `Time: ${formatMelbourneTime(ride.rideDate)}\n\n` +
      `Driver: ${driver.name}\n` +
      `Phone: ${driver.phone}\n\n` +
      `Need help? Call 0488 797 233`;

    await client.messages.create({ from: process.env.TWILIO_PHONE_NUMBER, to: phone, body: smsText });
    res.json({ message: 'Ride assigned and SMS sent.', ride: updatedRide });
  } catch (err) {
    console.error('❌ Error assigning ride:', err);
    res.status(500).json({ error: 'Failed to assign ride.' });
  }
};

const unassignRideFromDriver = async (req, res) => {
  const rideId = parseInt(req.params.id);
  const { driverId } = req.body;
  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) return res.status(403).json({ error: 'You are not allowed to unassign this ride.' });

    const updated = await prisma.ride.update({ where: { id: rideId }, data: { driverId: null } });
    const phone = ride.phone.startsWith('+') ? ride.phone : `+61${ride.phone.replace(/^0/, '')}`;
    const smsText =
      `Hi ${ride.name},\n` +
      `Your driver is no longer available for your Express Cabs ride.\n` +
      `We're now finding another driver.\n\n` +
      `No action is needed.\nNeed help? Call 0482 038 902`;

    await client.messages.create({ from: process.env.TWILIO_PHONE_NUMBER, to: phone, body: smsText });
    res.json({ message: 'Ride unassigned and SMS sent.', ride: updated });
  } catch (err) {
    console.error('❌ Error unassigning ride:', err);
    res.status(500).json({ error: 'Failed to unassign ride.' });
  }
};

const getRidesForUser = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const rides = await prisma.ride.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { rideDate: 'desc' },
      include: { driver: true },
    });
    res.json(rides);
  } catch (error) {
    console.error('❌ Failed to fetch user rides:', error);
    res.status(500).json({ error: 'Failed to fetch user rides' });
  }
};

const markRideCompleted = async (req, res) => {
  const rideId = parseInt(req.params.id);
  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ error: 'Ride not found.' });
    const updatedRide = await prisma.ride.update({ where: { id: rideId }, data: { status: 'completed' } });
    res.json({ message: 'Ride marked as completed.', ride: updatedRide });
  } catch (err) {
    console.error('❌ Failed to mark ride completed:', err);
    res.status(500).json({ error: 'Failed to mark ride as completed.' });
  }
};

module.exports = {
  bookRide,
  getAssignedRides,
  getUnassignedRides,
  assignRideToDriver,
  unassignRideFromDriver,
  getRidesForUser,
  markRideCompleted,
};
