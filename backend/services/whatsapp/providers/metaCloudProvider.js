const DEFAULT_GRAPH_VERSION = 'v20.0';
const DEFAULT_TIMEOUT_MS = 10000;

const getMetaConfig = () => ({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  graphVersion: process.env.WHATSAPP_GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION,
  timeoutMs: Number(process.env.WHATSAPP_PROVIDER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
});

const sanitizeError = (message) => {
  let sanitized = String(message || 'Meta WhatsApp request failed');
  [process.env.WHATSAPP_ACCESS_TOKEN].filter(Boolean).forEach((secret) => {
    sanitized = sanitized.split(secret).join('[redacted]');
  });
  return sanitized.slice(0, 500);
};

const buildMessagesEndpoint = ({ graphVersion, phoneNumberId }) =>
  `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

const sendText = async ({ to, body }, options = {}) => {
  const { accessToken, phoneNumberId, graphVersion, timeoutMs } = getMetaConfig();
  const fetchImpl = options.fetchImpl || global.fetch;

  if (!accessToken || !phoneNumberId) {
    return { success: false, provider: 'meta', error: 'Meta WhatsApp provider is not configured' };
  }
  if (typeof fetchImpl !== 'function') {
    return { success: false, provider: 'meta', error: 'HTTP fetch is not available for WhatsApp provider' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(buildMessagesEndpoint({ graphVersion, phoneNumberId }), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body,
        },
      }),
      signal: controller.signal,
    });
    const responseBody = await response.json().catch(() => ({}));
    const message = responseBody?.messages?.[0] || {};

    if (!response.ok || !message.id) {
      return {
        success: false,
        provider: 'meta',
        status: String(response.status),
        error: sanitizeError(responseBody?.error?.message || response.statusText),
      };
    }

    return {
      success: true,
      provider: 'meta',
      providerMessageId: message.id,
      status: message.message_status || 'accepted',
    };
  } catch (error) {
    return {
      success: false,
      provider: 'meta',
      error: error.name === 'AbortError' ? 'Meta WhatsApp request timed out' : sanitizeError(error.message),
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  buildMessagesEndpoint,
  sendText,
};
