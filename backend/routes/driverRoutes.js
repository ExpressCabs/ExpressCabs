const express = require('express');
const router = express.Router();
const {
    generateInviteToken,
    checkInviteToken,
    registerDriver,
    driverForgotPassword,
    driverResetPassword,
    loginDriver
} = require('../controllers/driverController');

// Generate invite token (POST)
router.post('/generate-invite', generateInviteToken);

// Check if token is valid (GET)
router.get('/check-invite', checkInviteToken);

// Register a driver using invite token (POST)
router.post('/register', registerDriver);

// Forgot + Reset password
router.post('/forgot-password', driverForgotPassword);
router.post('/reset-password', driverResetPassword);

// Login
router.post('/login', loginDriver);

module.exports = router;
