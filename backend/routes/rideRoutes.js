// rideRoutes.js - API route for ride booking
// routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const {
    bookRide,
    getUnassignedRides,
    assignRideToDriver,
    unassignRideFromDriver
} = require('../controllers/rideController');

router.post('/rides/book-ride', bookRide);
router.get('/rides/unassigned', getUnassignedRides);
router.post('/rides/:id/assign', assignRideToDriver);
router.post('/rides/:id/unassign', unassignRideFromDriver);

module.exports = router;
