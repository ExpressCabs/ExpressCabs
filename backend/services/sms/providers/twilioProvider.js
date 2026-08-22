const twilio = require('twilio');

const getTwilioConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  from: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM,
});

const send = async ({ to, message }) => {
  const { accountSid, authToken, from } = getTwilioConfig();

  if (!accountSid || !authToken || !from) {
    return {
      success: false,
      provider: 'twilio',
      error: 'Twilio SMS provider is not configured',
    };
  }

  try {
    const client = twilio(accountSid, authToken);
    const response = await client.messages.create({
      to,
      from,
      body: message,
    });

    return {
      success: true,
      provider: 'twilio',
      providerMessageId: response.sid || null,
      status: response.status || 'queued',
      cost: response.price ?? null,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'twilio',
      error: String(error.message || 'Twilio request failed').slice(0, 500),
    };
  }
};

module.exports = {
  send,
};
