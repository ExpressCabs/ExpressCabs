const nodemailer = require('nodemailer');

let transporter = null;

const getMailTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

module.exports = {
  getMailTransporter,
};
