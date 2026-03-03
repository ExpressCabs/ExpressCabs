const { getMailTransporter } = require('../lib/mailer');
const { isNonEmptyString } = require('../lib/validators');

exports.handleContactForm = async (req, res) => {
    const { name, email, phone, message, type, callback } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!isNonEmptyString(name) || !isNonEmptyString(message)) {
        return res.status(400).json({ success: false, message: 'Name and message are required' });
    }

    try {
        const mailOptions = {
            from: `"Express Cabs Contact" <${process.env.EMAIL_USER}>`,
            to: `"Express Cabs Contact" <${process.env.EMAIL_USER}>`,
            subject: `New Contact Form: ${String(type || 'General').slice(0, 80)}`,
            text:
                `
                Name: ${String(name).trim()}
                Email: ${normalizedEmail || 'N/A'}
                Phone: ${String(phone || '').trim() || 'N/A'}
                Type: ${type}
                Callback Requested: ${callback ? 'Yes' : 'No'}

                Message:
                    ${String(message).trim()}
             `,
            replyTo: normalizedEmail || undefined,
        };

        const info = await getMailTransporter().sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('Email not sent:', err);
        return res.status(500).json({ success: false, message: 'Email sending failed', error: err.message });
    }
};
