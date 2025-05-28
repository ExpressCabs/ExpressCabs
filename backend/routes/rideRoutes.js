// rideRoutes.js - API route for ride booking
// routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const { bookRide } = require('../controllers/rideController');

router.post('/book-ride', bookRide);

module.exports = router;
