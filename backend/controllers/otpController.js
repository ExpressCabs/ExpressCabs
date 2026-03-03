const twilio = require('twilio');
const { normalizeAuPhone } = require('../lib/validators');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const senderNumber = process.env.TWILIO_PHONE_NUMBER;

const otpStore = new Map();
const otpRequestStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function canRequestOtp(phone) {
  const now = Date.now();
  const current = otpRequestStore.get(phone);

  if (!current || current.resetAt <= now) {
    otpRequestStore.set(phone, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;

  current.count += 1;
  otpRequestStore.set(phone, current);
  return true;
}

exports.sendOtp = async (req, res) => {
  const formattedPhone = normalizeAuPhone(req.body.phone);
  if (!formattedPhone) {
    return res.status(400).json({ error: 'Phone is required' });
  }

  if (!canRequestOtp(formattedPhone)) {
    return res.status(429).json({ error: 'Too many OTP requests. Please try later.' });
  }

  const otp = generateOTP();
  otpStore.set(formattedPhone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  if (process.env.OTP_ENABLED === 'false') {
    return res.json({ success: true, message: 'OTP bypassed' });
  }

  try {
    await client.messages.create({
      body: `Your Express Cabs OTP is: ${otp}`,
      from: senderNumber,
      to: formattedPhone,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOtp = (req, res) => {
  if (process.env.OTP_ENABLED === 'false') {
    return res.json({ valid: true });
  }

  const otp = String(req.body.otp || '').trim();
  const formattedPhone = normalizeAuPhone(req.body.phone);

  if (!formattedPhone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const record = otpStore.get(formattedPhone);
  if (!record) return res.status(400).json({ error: 'No OTP found' });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(formattedPhone);
    return res.status(429).json({ error: 'Too many invalid attempts. Request a new OTP.' });
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    otpStore.set(formattedPhone, record);
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(formattedPhone);
  return res.json({ valid: true });
};
