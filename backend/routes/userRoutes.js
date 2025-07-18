const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/userController');
const {
    userForgotPassword,
    userVerifyOtp,
} = require('../controllers/userController');

router.post('/forgot-password', userForgotPassword);
router.post('/verify-otp', userVerifyOtp);


router.post('/login', loginUser);

router.post('/register', registerUser);

module.exports = router;
