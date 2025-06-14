require('dotenv').config();
const nodemailer = require('nodemailer');

exports.handleContactForm = async (req, res) => {
    console.log("📬 Contact form hit");
    const { name, email, phone, message, type, callback } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Express Cabs Contact" <${process.env.EMAIL_USER}>`,
            to: 'chouhanexpo96@gmail.com', // your recipient
            subject: `New Contact Form: ${type}`,
            text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Type: ${type}
Callback Requested: ${callback ? 'Yes' : 'No'}

Message:
${message}
      `,
            replyTo: email, // optional: so replies go to sender
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📨 Email sent:', info.response);
        return res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('❌ Email not sent:', err);
        return res.status(500).json({ success: false, message: 'Email sending failed', error: err.message });
    }
};
