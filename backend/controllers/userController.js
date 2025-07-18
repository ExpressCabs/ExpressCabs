// controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.registerUser = async (req, res) => {
    const { name, phone, email, password } = req.body;

    if (!phone || !password || !name) {
        return res.status(400).json({ message: 'Name, phone, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            phone,
            email,
            password: hashedPassword,
        },
    });

    res.status(201).json({ user });
};


const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Step 1: Send OTP
exports.userForgotPassword = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });

    try {
        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.user.update({
            where: { phone },
            data: { otpCode: otp, otpExpiresAt: expiry },
        });

        await twilioClient.messages.create({
            to: phone,
            from: process.env.TWILIO_PHONE_NUMBER,
            body: `Your Prime Cabs OTP is: ${otp}`,
        });

        res.json({ message: 'OTP sent via SMS' });
    } catch (err) {
        console.error('Forgot password SMS error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Step 2: Verify OTP + Reset Password
exports.userVerifyOtp = async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword)
        return res.status(400).json({ message: 'Missing fields' });

    const user = await prisma.user.findFirst({
        where: {
            phone,
            otpCode: otp,
            otpExpiresAt: { gte: new Date() },
        },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashed,
            otpCode: null,
            otpExpiresAt: null,
        },
    });

    res.json({ message: 'Password reset successful' });
};

exports.loginUser = async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ message: 'Phone and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
    }

    res.json({ user });
};
