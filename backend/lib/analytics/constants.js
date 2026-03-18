const ALLOWED_EVENT_NAMES = [
  'session_started',
  'page_view',
  'engaged_view',
  'booking_started',
  'pickup_entered',
  'dropoff_entered',
  'fare_calculated',
  'vehicle_selected',
  'passenger_details_submitted',
  'booking_submit_attempt',
  'booking_submit_success',
  'booking_submit_error',
  'tel_click',
  'whatsapp_click',
  'session_ended',
];

const MAX_EVENT_BATCH_SIZE = 25;
const MAX_STRING_LENGTH = 255;
const MAX_TEXT_LENGTH = 1200;
const MAX_METADATA_KEYS = 25;

module.exports = {
  ALLOWED_EVENT_NAMES,
  MAX_EVENT_BATCH_SIZE,
  MAX_STRING_LENGTH,
  MAX_TEXT_LENGTH,
  MAX_METADATA_KEYS,
};
