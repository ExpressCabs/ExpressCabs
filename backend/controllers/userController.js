// controllers/userController.js
const prisma = require('../lib/prisma');
const twilio = require('twilio');
const bcrypt = require('bcrypt');
const { normalizeAuPhone, isNonEmptyString } = require('../lib/validators');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const publicUserFields = {
  id: true,
  name: true,
  phone: true,
  email: true,
  createdAt: true,
};

exports.registerUser = async (req, res) => {
  const { name, phone, email, password } = req.body;
  const normalizedPhone = normalizeAuPhone(phone);

  if (!isNonEmptyString(name) || !isNonEmptyString(normalizedPhone) || !isNonEmptyString(password)) {
    return res.status(400).json({ message: 'Name, phone, and password are required' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        phone: normalizedPhone,
        email: isNonEmptyString(email) ? String(email).trim().toLowerCase() : null,
        password: hashedPassword,
      },
      select: publicUserFields,
    });

    return res.status(201).json({ user });
  } catch (err) {
    console.error('User registration error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Step 1: Send OTP
exports.userForgotPassword = async (req, res) => {
  const normalizedPhone = normalizeAuPhone(req.body.phone);
  if (!isNonEmptyString(normalizedPhone)) {
    return res.status(400).json({ message: 'Phone is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { phone: normalizedPhone },
        data: { otpCode: otp, otpExpiresAt: expiry },
      });

      await twilioClient.messages.create({
        to: normalizedPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `Your Prime Cabs OTP is: ${otp}`,
      });
    }

    return res.json({ message: 'If the account exists, OTP has been sent via SMS' });
  } catch (err) {
    console.error('Forgot password SMS error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Step 2: Verify OTP + Reset Password
exports.userVerifyOtp = async (req, res) => {
  const { otp, newPassword } = req.body;
  const normalizedPhone = normalizeAuPhone(req.body.phone);

  if (!isNonEmptyString(normalizedPhone) || !isNonEmptyString(otp) || !isNonEmptyString(newPassword)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        phone: normalizedPhone,
        otpCode: String(otp).trim(),
        otpExpiresAt: { gte: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.loginUser = async (req, res) => {
  const normalizedPhone = normalizeAuPhone(req.body.phone);
  const { password } = req.body;

  if (!isNonEmptyString(normalizedPhone) || !isNonEmptyString(password)) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('User login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
