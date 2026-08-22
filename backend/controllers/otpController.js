const crypto = require('crypto');
const { normalizeAuPhone } = require('../lib/validators');
const smsService = require('../services/sms/smsService');
const { SMS_MESSAGE_TYPES } = require('../services/sms/smsTemplates');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const otpStore = new Map();

const cleanupExpiredOtps = () => {
  const now = Date.now();

  for (const [phone, otpRecord] of otpStore.entries()) {
    if (!otpRecord || otpRecord.expiresAt <= now) {
      otpStore.delete(phone);
    }
  }
};

exports.sendOtp = async (req, res) => {
  const formattedPhone = normalizeAuPhone(req.body.phone);
  if (!formattedPhone) {
    return res.status(400).json({ error: 'Phone is required' });
  }

  cleanupExpiredOtps();

  const otp = crypto.randomInt(100000, 1000000).toString();
  otpStore.set(formattedPhone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  try {
    const smsResult = await smsService.send({
      to: formattedPhone,
      type: SMS_MESSAGE_TYPES.OTP_VERIFICATION,
      data: { otp },
    });

    if (!smsResult.success) {
      otpStore.delete(formattedPhone);
      console.error('Booking OTP send error:', smsResult.error);
      return res.status(500).json({
        error: smsResult.error && smsResult.error.includes('configured')
          ? 'OTP service is not configured'
          : 'Failed to send OTP',
      });
    }

    return res.json({ success: true, message: 'OTP sent to your phone' });
  } catch (error) {
    otpStore.delete(formattedPhone);
    console.error('Booking OTP send error:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOtp = (req, res) => {
  const formattedPhone = normalizeAuPhone(req.body.phone);
  const submittedOtp = String(req.body.otp || '').trim();

  if (!formattedPhone) {
    return res.status(400).json({ error: 'Phone is required' });
  }

  if (!/^\d{6}$/.test(submittedOtp)) {
    return res.status(400).json({ error: 'Enter the 6 digit OTP' });
  }

  cleanupExpiredOtps();

  const otpRecord = otpStore.get(formattedPhone);
  if (!otpRecord) {
    return res.status(400).json({ valid: false, error: 'OTP expired. Please request a new code.' });
  }

  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(formattedPhone);
    return res.status(429).json({ valid: false, error: 'Too many attempts. Please request a new code.' });
  }

  otpRecord.attempts += 1;

  if (otpRecord.otp !== submittedOtp) {
    return res.status(400).json({ valid: false, error: 'Invalid OTP' });
  }

  otpStore.delete(formattedPhone);
  return res.json({ valid: true });
};
