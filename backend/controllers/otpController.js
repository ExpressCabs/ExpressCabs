const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const senderNumber = process.env.TWILIO_PHONE_NUMBER;
const otpStore = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhone(phone) {
    return phone.replace(/\s+/g, '').replace(/^0/, '+61');
}

// 🚀 Send OTP
exports.sendOtp = async (req, res) => {
    const { phone } = req.body;
    const formattedPhone = formatPhone(phone);
    const otp = generateOTP();

    otpStore.set(formattedPhone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

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
        console.error('❌ Error sending OTP:', err);
        return res.status(500).json({ error: 'Failed to send OTP' });
    }
};

// ✅ Verify OTP
exports.verifyOtp = (req, res) => {
    if (process.env.OTP_ENABLED === 'false') {
        return res.json({ valid: true });
    }

    const { phone, otp } = req.body;
    const formattedPhone = formatPhone(phone);

    if (!formattedPhone || !otp) {
        console.error('❌ Missing phone or OTP:', req.body);
        return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const record = otpStore.get(formattedPhone);

    if (!record) return res.status(400).json({ error: 'No OTP found' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    otpStore.delete(formattedPhone);
    return res.json({ valid: true });
};
