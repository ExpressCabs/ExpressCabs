const SMS_MESSAGE_TYPES = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  OTP_VERIFICATION: 'OTP_VERIFICATION',
  PASSWORD_RESET_OTP: 'PASSWORD_RESET_OTP',
};

const buildBookingConfirmationMessage = ({ pickup, dropoff, formattedTime }) => [
  'Prime Cabs: Booking confirmed.',
  `Pickup: ${pickup}`,
  `Drop-off: ${dropoff}`,
  `Time: ${formattedTime}`,
].join('\n');

const buildOtpVerificationMessage = ({ otp }) => `Your Prime Cabs verification code is: ${otp}`;

const buildPasswordResetOtpMessage = ({ otp }) => `Your Prime Cabs OTP is: ${otp}`;

const buildSmsMessage = ({ type, data = {}, message }) => {
  if (message) return message;

  switch (type) {
    case SMS_MESSAGE_TYPES.BOOKING_CONFIRMATION:
      return buildBookingConfirmationMessage(data);
    case SMS_MESSAGE_TYPES.OTP_VERIFICATION:
      return buildOtpVerificationMessage(data);
    case SMS_MESSAGE_TYPES.PASSWORD_RESET_OTP:
      return buildPasswordResetOtpMessage(data);
    default:
      throw new Error(`Unsupported SMS message type: ${type}`);
  }
};

module.exports = {
  SMS_MESSAGE_TYPES,
  buildSmsMessage,
};
