const prisma = require('../../lib/prisma');
const { normalizeAuPhone, isNonEmptyString } = require('../../lib/validators');
const { buildSmsMessage } = require('./smsTemplates');
const clicksendProvider = require('./providers/clicksendProvider');
const twilioProvider = require('./providers/twilioProvider');

const providers = {
  clicksend: clicksendProvider,
  twilio: twilioProvider,
};

const getConfiguredProviderName = () => String(
  process.env.SMS_PROVIDER || process.env.DEFAULT_SMS_PROVIDER || 'twilio'
).trim().toLowerCase();

const normalizeCost = (cost) => {
  if (cost === null || cost === undefined || cost === '') return null;
  const parsed = Number(cost);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeErrorMessage = (message) => {
  let sanitized = String(message || 'SMS provider failed');
  [
    process.env.CLICKSEND_API_KEY,
    process.env.CLICKSEND_USERNAME,
    process.env.TWILIO_AUTH_TOKEN,
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_SID,
  ].filter(Boolean).forEach((secret) => {
    sanitized = sanitized.split(secret).join('[redacted]');
  });
  return sanitized.slice(0, 500);
};

const writeSmsLog = async ({ request, normalizedTo, result }) => {
  if (!prisma?.smsMessage?.create) return;

  try {
    await prisma.smsMessage.create({
      data: {
        rideId: request.metadata?.rideId || null,
        recipient: normalizedTo,
        messageType: request.type,
        provider: result.provider,
        status: result.status || (result.success ? 'sent' : 'failed'),
        providerMessageId: result.providerMessageId || null,
        errorMessage: result.success ? null : sanitizeErrorMessage(result.error),
        cost: normalizeCost(result.cost),
        sentAt: result.success ? new Date() : null,
      },
    });
  } catch (error) {
    console.error('Failed to write SMS log:', error);
  }
};

const send = async (request) => {
  const providerName = getConfiguredProviderName();
  const provider = providers[providerName];

  if (!provider) {
    return {
      success: false,
      provider: providerName || 'unknown',
      error: `Unsupported SMS provider: ${providerName}`,
    };
  }

  const normalizedTo = normalizeAuPhone(request?.to);
  if (!isNonEmptyString(normalizedTo) || !/^\+61\d{9}$/.test(normalizedTo)) {
    const result = {
      success: false,
      provider: providerName,
      error: 'Invalid Australian mobile number',
    };
    await writeSmsLog({ request: request || {}, normalizedTo: normalizedTo || String(request?.to || ''), result });
    return result;
  }

  let message;
  try {
    message = buildSmsMessage({
      type: request.type,
      data: request.data,
      message: request.message,
    });
  } catch (error) {
    return {
      success: false,
      provider: providerName,
      error: error.message,
    };
  }

  if (!isNonEmptyString(message)) {
    return {
      success: false,
      provider: providerName,
      error: 'SMS message is required',
    };
  }

  let result;
  try {
    result = await provider.send({
      to: normalizedTo,
      type: request.type,
      message,
      metadata: request.metadata || {},
    });
  } catch (error) {
    result = {
      success: false,
      provider: providerName,
      error: sanitizeErrorMessage(error.message),
    };
  }

  await writeSmsLog({ request, normalizedTo, result });

  return {
    success: Boolean(result.success),
    provider: result.provider || providerName,
    providerMessageId: result.providerMessageId || null,
    status: result.status || (result.success ? 'sent' : 'failed'),
    cost: result.cost ?? null,
    ...(result.success ? {} : { error: sanitizeErrorMessage(result.error) }),
  };
};

module.exports = {
  send,
  getConfiguredProviderName,
};
