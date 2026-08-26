const SMS_MESSAGE_TYPES = {
  BOOKING_CONFIRMATION: 'BOOKING_CONFIRMATION',
  OTP_VERIFICATION: 'OTP_VERIFICATION',
  PASSWORD_RESET_OTP: 'PASSWORD_RESET_OTP',
};

const BOOKING_CONTACT_NUMBERS = {
  local_taxi_melbourne: '0433 042 217',
  prime_cabs_melbourne: '0488 797 233',
};

const buildBookingConfirmationMessage = ({ pickup, dropoff, formattedTime, siteKey }) => [
  'No reply - Booking confirmed.',
  `Pickup: ${pickup}`,
  `Drop-off: ${dropoff}`,
  `Time: ${formattedTime}`,
  `If you need to change anything, call ${BOOKING_CONTACT_NUMBERS[siteKey] || BOOKING_CONTACT_NUMBERS.prime_cabs_melbourne}.`,
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
