const { normalizeAuPhone } = require('../lib/validators');

exports.sendOtp = async (req, res) => {
  const formattedPhone = normalizeAuPhone(req.body.phone);
  if (!formattedPhone) {
    return res.status(400).json({ error: 'Phone is required' });
  }
  return res.json({ success: true, message: 'OTP bypassed' });
};

exports.verifyOtp = (req, res) => {
  const formattedPhone = normalizeAuPhone(req.body.phone);
  if (!formattedPhone) {
    return res.status(400).json({ error: 'Phone is required' });
  }
  return res.json({ valid: true });
};
