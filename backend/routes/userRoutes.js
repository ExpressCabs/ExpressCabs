const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/userController');

router.post('/login', loginUser);

router.post('/register', registerUser);

module.exports = router;
