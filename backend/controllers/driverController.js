const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { getMailTransporter } = require('../lib/mailer');
const { isNonEmptyString } = require('../lib/validators');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidEmail = (email) => {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

const publicDriverFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  dcNumber: true,
  taxiReg: true,
  carModel: true,
};

// POST /api/drivers/register
exports.registerDriver = async (req, res) => {
  const { name, email, phone, password, dcNumber, taxiRegistration, carModel, token } = req.body;

  if (!name || !email || !phone || !password || !dcNumber || !taxiRegistration || !carModel || !token) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }

  try {
    const invite = await prisma.driverInvite.findUnique({ where: { token: String(token).trim() } });

    if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired invite token' });
    }

    if (normalizeEmail(invite.email) !== normalizedEmail) {
      return res.status(400).json({ success: false, error: 'Invite token does not match email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.driver.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          phone: String(phone).trim(),
          password: hashedPassword,
          dcNumber: String(dcNumber).trim(),
          taxiReg: String(taxiRegistration).trim(),
          carModel: String(carModel).trim(),
        },
      }),
      prisma.driverInvite.update({
        where: { token: String(token).trim() },
        data: { used: true },
      }),
    ]);

    return res.status(201).json({ success: true, message: 'Driver registered successfully' });
  } catch (err) {
    console.error('Driver registration error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/drivers/check-invite?token=XYZ
exports.checkInviteToken = async (req, res) => {
  const token = String(req.query.token || '').trim();

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
  const normalizedEmail = normalizeEmail(req.body.email);
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const driver = await prisma.driver.findUnique({ where: { email: normalizedEmail } });

    if (driver) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.driver.update({
        where: { email: normalizedEmail },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      const resetLink = `https://www.primecabsmelbourne.com.au/reset-password?role=driver&token=${token}`;

      await getMailTransporter().sendMail({
        from: `"Prime Cabs" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Reset Your Driver Password',
        html: `
                <p>You requested to reset your driver password.</p>
                <p><a href="${resetLink}">Click here to reset your password</a></p>
                <p>This link expires in 1 hour.</p>
            `,
      });
    }

    return res.json({ message: 'If the account exists, reset link has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.driverResetPassword = async (req, res) => {
  const token = String(req.query.token || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Missing token or password' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const driver = await prisma.driver.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!driver) return res.status(400).json({ message: 'Invalid or expired token' });

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Driver reset password error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/drivers/generate-invite
exports.generateInviteToken = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ success: false, error: 'Valid email required' });
  }

  try {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invite = await prisma.driverInvite.upsert({
      where: { email: normalizedEmail },
      update: { token, expiresAt, used: false },
      create: { email: normalizedEmail, token, expiresAt },
    });

    const inviteLink = `https://www.primecabsmelbourne.com.au/driver-register?token=${token}`;

    await getMailTransporter().sendMail({
      from: `"Prime Cabs" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "You're Invited to Register as a Driver",
      html: `
                <p>Hello,</p>
                <p>You have been invited to register as a driver for Prime Cabs Melbourne.</p>
                <p>Click the link below to complete your registration. This link is valid for 24 hours:</p>
                <p><a href="${inviteLink}">${inviteLink}</a></p>
                <p>If you did not request this, please ignore this email.</p>
                <br/>
                <p>Prime Cabs Team</p>
            `,
    });

    return res.json({ success: true, token: invite.token, message: 'Invite token generated' });
  } catch (err) {
    console.error('Token generation error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.loginDriver = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!isValidEmail(normalizedEmail) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { email: normalizedEmail },
      select: {
        ...publicDriverFields,
        password: true,
      },
    });

    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safeDriver } = driver;
    return res.json({ driver: safeDriver });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
