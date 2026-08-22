const CLICKSEND_SMS_ENDPOINT = 'https://rest.clicksend.com/v3/sms/send';
const DEFAULT_TIMEOUT_MS = 10000;

const redactProviderError = (value) => String(value || 'ClickSend request failed').slice(0, 500);

const buildAuthHeader = ({ username, apiKey }) => {
  const token = Buffer.from(`${username}:${apiKey}`).toString('base64');
  return `Basic ${token}`;
};

const send = async ({ to, message, metadata = {} }, options = {}) => {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  const source = process.env.SMS_SOURCE || 'primecabs-booking';
  const fetchImpl = options.fetchImpl || global.fetch;
  const timeoutMs = Number(process.env.SMS_PROVIDER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  if (!username || !apiKey) {
    return {
      success: false,
      provider: 'clicksend',
      error: 'ClickSend SMS provider is not configured',
    };
  }

  if (typeof fetchImpl !== 'function') {
    return {
      success: false,
      provider: 'clicksend',
      error: 'HTTP fetch is not available for ClickSend SMS provider',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(CLICKSEND_SMS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader({ username, apiKey }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            source,
            body: message,
            to,
            custom_string: metadata?.rideId ? `ride:${metadata.rideId}` : undefined,
          },
        ],
      }),
      signal: controller.signal,
    });

    const responseBody = await response.json().catch(() => ({}));
    const providerMessage = responseBody?.data?.messages?.[0] || {};

    if (!response.ok || responseBody?.response_code === 'FAIL' || providerMessage.status === 'INVALID_RECIPIENT') {
      return {
        success: false,
        provider: 'clicksend',
        status: providerMessage.status || responseBody?.response_code || String(response.status),
        error: redactProviderError(providerMessage.error || responseBody?.response_msg || response.statusText),
      };
    }

    return {
      success: true,
      provider: 'clicksend',
      providerMessageId: providerMessage.message_id || null,
      status: providerMessage.status || responseBody?.response_code || 'sent',
      cost: providerMessage.message_price ?? null,
    };
  } catch (error) {
    return {
      success: false,
      provider: 'clicksend',
      error: error.name === 'AbortError' ? 'ClickSend request timed out' : redactProviderError(error.message),
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  CLICKSEND_SMS_ENDPOINT,
  buildAuthHeader,
  send,
};
