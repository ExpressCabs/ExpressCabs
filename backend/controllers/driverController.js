const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// POST /api/drivers/register
exports.registerDriver = async (req, res) => {
    const {
        name,
        email,
        phone,
        password,
        dcNumber,
        taxiRegistration,
        carModel,
        token,
    } = req.body;

    if (!name || !email || !phone || !password || !dcNumber || !taxiRegistration || !carModel || !token) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        // Validate invite token
        const invite = await prisma.driverInvite.findUnique({ where: { token } });

        if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
            return res.status(400).json({ success: false, error: 'Invalid or expired invite token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.driver.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                dcNumber,
                taxiReg: taxiRegistration,
                carModel,
            },
        });

        // Mark token as used
        await prisma.driverInvite.update({
            where: { token },
            data: { used: true },
        });

        return res.status(201).json({ success: true, message: 'Driver registered successfully' });
    } catch (err) {
        console.error('Driver registration error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};

// GET /api/drivers/check-invite?token=XYZ
exports.checkInviteToken = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ success: false, error: 'Token required' });
    }

    try {
        const invite = await prisma.driverInvite.findUnique({ where: { token } });

        if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        return res.json({ success: true, email: invite.email });
    } catch (err) {
        console.error('Check token error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};

exports.driverForgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const driver = await prisma.driver.findUnique({ where: { email } });
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.driver.update({
            where: { email },
            data: { resetToken: token, resetTokenExpiry: expiry },
        });

        const resetLink = `https://www.primecabsmelbourne.com.au/reset-password?role=driver&token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Prime Cabs" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Driver Password',
            html: `
                <p>You requested to reset your driver password.</p>
                <p><a href="${resetLink}">Click here to reset your password</a></p>
                <p>This link expires in 1 hour.</p>
            `,
        });

        res.json({ message: 'Reset link sent to email' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.driverResetPassword = async (req, res) => {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token || !newPassword)
        return res.status(400).json({ message: 'Missing token or password' });

    const driver = await prisma.driver.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: { gte: new Date() },
        },
    });

    if (!driver) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.driver.update({
        where: { id: driver.id },
        data: {
            password: hashed,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });

    res.json({ message: 'Password reset successful' });
};


// POST /api/drivers/generate-invite
exports.generateInviteToken = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
    }

    try {
        const token = Math.random().toString(36).substring(2, 12);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hrs

        const invite = await prisma.driverInvite.create({
            data: { email, token, expiresAt },
        });

        // Send invite email
        const inviteLink = `https://www.primecabsmelbourne.com.au/driver-register?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail', // or Mailgun/SMTP service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Prime Cabs" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "You're Invited to Register as a Driver",
            html: `
                <p>Hello,</p>
                <p>You’ve been invited to register as a driver for Prime Cabs Melbourne.</p>
                <p>Click the link below to complete your registration. This link is valid for 24 hours:</p>
                <p><a href="${inviteLink}">${inviteLink}</a></p>
                <p>If you did not request this, please ignore this email.</p>
                <br/>
                <p>— Prime Cabs Team</p>
            `,
        });

        return res.json({ success: true, token: invite.token, message: 'Invite token generated' });
    } catch (err) {
        console.error('Token generation error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};


exports.loginDriver = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const driver = await prisma.driver.findUnique({ where: { email } });

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        const isMatch = await bcrypt.compare(password, driver.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        res.json({ driver });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};


