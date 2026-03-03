// controllers/rideController.js
const prisma = require('../lib/prisma');
const { getMailTransporter } = require('../lib/mailer');
const { normalizeAuPhone, parsePositiveInt } = require('../lib/validators');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const formatMelbourneTime = (dateInput) => {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

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
      userId,
    } = req.body;

    const parsedRideDate = new Date(rideDate);
    const parsedPassengerCount = Number(passengerCount);
    const parsedFare = Number(fare);
    const parsedPickupLat = Number(pickupLat);
    const parsedPickupLng = Number(pickupLng);
    const parsedDropoffLat = Number(dropoffLat);
    const parsedDropoffLng = Number(dropoffLng);

    if (
      !name ||
      !phone ||
      !pickup ||
      !dropoff ||
      !rideDate ||
      !vehicleType ||
      !fareType ||
      Number.isNaN(parsedRideDate.getTime()) ||
      !Number.isFinite(parsedPassengerCount) ||
      !Number.isFinite(parsedFare) ||
      !Number.isFinite(parsedPickupLat) ||
      !Number.isFinite(parsedPickupLng) ||
      !Number.isFinite(parsedDropoffLat) ||
      !Number.isFinite(parsedDropoffLng)
    ) {
      console.warn('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ride = await prisma.ride.create({
      data: {
        name,
        phone,
        email,
        note,
        pickup,
        pickupLat: parsedPickupLat,
        pickupLng: parsedPickupLng,
        dropoff,
        dropoffLat: parsedDropoffLat,
        dropoffLng: parsedDropoffLng,
        rideDate: parsedRideDate,
        passengerCount: parsedPassengerCount,
        vehicleType,
        fare: parsedFare,
        fareType,
        userId: userId || null,
      },
    });

    const notificationTasks = [];

    notificationTasks.push(
      getMailTransporter().sendMail({
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
          <p><strong>Date & Time:</strong> ${formatMelbourneTime(parsedRideDate)}</p>
          <p><strong>Passengers:</strong> ${parsedPassengerCount}</p>
          <p><strong>Vehicle:</strong> ${vehicleType}</p>
          <p><strong>Fare:</strong> $${parsedFare.toFixed(2)} (${fareType})</p>
          ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        `,
      })
    );

    const formattedPhone = normalizeAuPhone(phone);
    const smsText =
      `Hi ${name},\n` +
      `Your Express Cabs ride has been booked.\n\n` +
      `From: ${pickup}\n` +
      `To: ${dropoff}\n` +
      `Time: ${formatMelbourneTime(parsedRideDate)}\n` +
      `Vehicle: ${vehicleType} (${parsedPassengerCount} passengers)\n` +
      `Fare: $${parsedFare.toFixed(2)}\n\n` +
      `Need help? Call 0488 797 233`;

    notificationTasks.push(
      client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
        body: smsText,
      })
    );

    const notificationResults = await Promise.allSettled(notificationTasks);
    if (notificationResults[0].status === 'rejected') {
      console.error('Failed to send booking email:', notificationResults[0].reason);
    }
    if (notificationResults[1].status === 'rejected') {
      console.error('Failed to send booking SMS:', notificationResults[1].reason);
    }

    res.status(201).json(ride);
  } catch (error) {
    console.error('Error booking ride:', error);
    res.status(500).json({ error: 'Failed to book ride' });
  }
};

const getAssignedRides = async (req, res) => {
  const parsedDriverId = Number(req.query.driverId);
  const page = parsePositiveInt(req.query.page) || 1;
  const limit = Math.min(parsePositiveInt(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  if (!Number.isInteger(parsedDriverId)) {
    return res.status(400).json({ error: 'driverId is required' });
  }

  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: parsedDriverId },
      orderBy: { rideDate: 'asc' },
      skip,
      take: limit,
    });
    res.json(rides);
  } catch (error) {
    console.error('Error fetching assigned rides:', error);
    res.status(500).json({ error: 'Failed to fetch assigned rides' });
  }
};

const getUnassignedRides = async (req, res) => {
  const page = parsePositiveInt(req.query.page) || 1;
  const limit = Math.min(parsePositiveInt(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  try {
    const rides = await prisma.ride.findMany({
      where: { driverId: null },
      orderBy: { rideDate: 'asc' },
      skip,
      take: limit,
    });
    res.json(rides);
  } catch (error) {
    console.error('Failed to fetch unassigned rides:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned rides' });
  }
};

const assignRideToDriver = async (req, res) => {
  const rideId = Number(req.params.id);
  const driverId = Number(req.body.driverId);

  if (!Number.isInteger(rideId)) {
    return res.status(400).json({ error: 'Valid ride ID is required.' });
  }
  if (!Number.isInteger(driverId)) {
    return res.status(400).json({ error: 'Valid driver ID is required.' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ error: 'Ride not found.' });
    if (ride.driverId) return res.status(409).json({ error: 'Ride is already assigned.' });

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: 'Driver not found.' });

    const assignment = await prisma.ride.updateMany({
      where: { id: rideId, driverId: null },
      data: { driverId },
    });
    if (assignment.count === 0) {
      return res.status(409).json({ error: 'Ride is already assigned.' });
    }

    const updatedRide = await prisma.ride.findUnique({ where: { id: rideId } });

    const phone = normalizeAuPhone(ride.phone);
    const smsText =
      `Hi ${ride.name},\n` +
      `A driver has been assigned to your Express Cabs ride.\n\n` +
      `From: ${ride.pickup}\n` +
      `To: ${ride.dropoff}\n` +
      `Time: ${formatMelbourneTime(ride.rideDate)}\n\n` +
      `Driver: ${driver.name}\n` +
      `Phone: ${driver.phone}\n\n` +
      `Need help? Call 0488 797 233`;

    try {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
        body: smsText,
      });
    } catch (smsErr) {
      console.error('Failed to send assign SMS:', smsErr);
    }

    res.json({ message: 'Ride assigned and SMS sent.', ride: updatedRide });
  } catch (err) {
    console.error('Error assigning ride:', err);
    res.status(500).json({ error: 'Failed to assign ride.' });
  }
};

const unassignRideFromDriver = async (req, res) => {
  const rideId = Number(req.params.id);
  const driverId = Number(req.body.driverId);

  if (!Number.isInteger(rideId) || !Number.isInteger(driverId)) {
    return res.status(400).json({ error: 'Valid ride ID and driver ID are required.' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) {
      return res.status(403).json({ error: 'You are not allowed to unassign this ride.' });
    }

    const updated = await prisma.ride.update({ where: { id: rideId }, data: { driverId: null } });

    const phone = normalizeAuPhone(ride.phone);
    const smsText =
      `Hi ${ride.name},\n` +
      `Your driver is no longer available for your Express Cabs ride.\n` +
      `We're now finding another driver.\n\n` +
      `No action is needed.\nNeed help? Call 0488 797 233`;

    try {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
        body: smsText,
      });
    } catch (smsErr) {
      console.error('Failed to send unassign SMS:', smsErr);
    }

    res.json({ message: 'Ride unassigned and SMS sent.', ride: updated });
  } catch (err) {
    console.error('Error unassigning ride:', err);
    res.status(500).json({ error: 'Failed to unassign ride.' });
  }
};

const getRidesForUser = async (req, res) => {
  const parsedUserId = Number(req.params.userId);
  const page = parsePositiveInt(req.query.page) || 1;
  const limit = Math.min(parsePositiveInt(req.query.limit) || 50, 200);
  const skip = (page - 1) * limit;

  if (!Number.isInteger(parsedUserId)) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const rides = await prisma.ride.findMany({
      where: { userId: parsedUserId },
      orderBy: { rideDate: 'desc' },
      include: { driver: true },
      skip,
      take: limit,
    });
    res.json(rides);
  } catch (error) {
    console.error('Failed to fetch user rides:', error);
    res.status(500).json({ error: 'Failed to fetch user rides' });
  }
};

const markRideCompleted = async (req, res) => {
  const rideId = Number(req.params.id);
  if (!Number.isInteger(rideId)) {
    return res.status(400).json({ error: 'Valid ride ID is required.' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ error: 'Ride not found.' });

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'completed' },
    });

    res.json({ message: 'Ride marked as completed.', ride: updatedRide });
  } catch (err) {
    console.error('Failed to mark ride completed:', err);
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
