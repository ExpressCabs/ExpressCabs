// rideRoutes.js - API route for ride booking
// routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const {
    bookRide,
    getUnassignedRides,
    assignRideToDriver,
    unassignRideFromDriver,
    getAssignedRides,
    getRidesForUser,
    markRideCompleted,
} = require('../controllers/rideController');

router.post('/book-ride', bookRide);
router.get('/assigned', getAssignedRides);
router.get('/unassigned', getUnassignedRides);
router.post('/:id/assign', assignRideToDriver);
router.post('/:id/unassign', unassignRideFromDriver);
router.get('/user/:userId', getRidesForUser);
router.post('/:id/complete', markRideCompleted);


module.exports = router;
