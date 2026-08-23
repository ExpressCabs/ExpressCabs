const prisma = require('../../lib/prisma');
const { normalizeAuPhone } = require('../../lib/validators');
const metaProvider = require('./providers/metaCloudProvider');

const isWhatsAppEnabled = () => String(process.env.WHATSAPP_ENABLED || 'false').toLowerCase() === 'true';
const getOwnerWhatsApp = () => normalizeAuPhone(process.env.DISPATCH_OWNER_WHATSAPP || '');

const providers = {
  meta: metaProvider,
};

const getProviderName = () => String(process.env.WHATSAPP_PROVIDER || 'meta').trim().toLowerCase();

const sanitizeError = (message) => {
  let sanitized = String(message || 'WhatsApp send failed');
  [process.env.WHATSAPP_ACCESS_TOKEN].filter(Boolean).forEach((secret) => {
    sanitized = sanitized.split(secret).join('[redacted]');
  });
  return sanitized.slice(0, 500);
};

const sendText = async ({ to, body, dispatchJobId = null, bookingProposalId = null, messageType = 'TEXT' }) => {
  const providerName = getProviderName();
  const provider = providers[providerName];
  const normalizedTo = normalizeAuPhone(to);

  if (!isWhatsAppEnabled()) {
    return { success: false, provider: providerName, error: 'WhatsApp is disabled' };
  }
  if (!provider) {
    return { success: false, provider: providerName, error: `Unsupported WhatsApp provider: ${providerName}` };
  }
  if (!/^\+61\d{9}$/.test(normalizedTo)) {
    return { success: false, provider: providerName, error: 'Invalid WhatsApp destination number' };
  }

  const result = await provider.sendText({ to: normalizedTo, body });
  const safeResult = {
    ...result,
    error: result.success ? undefined : sanitizeError(result.error),
  };

  if (prisma?.whatsAppMessage?.create) {
    await prisma.whatsAppMessage.create({
      data: {
        dispatchJobId,
        bookingProposalId,
        direction: 'OUTBOUND',
        provider: safeResult.provider || providerName,
        providerMessageId: safeResult.providerMessageId || null,
        toNumber: normalizedTo,
        messageType,
        body,
        status: safeResult.status || (safeResult.success ? 'accepted' : 'failed'),
      },
    }).catch((error) => {
      console.error('Failed to write WhatsApp outbound log:', error);
    });
  }

  return safeResult;
};

module.exports = {
  getOwnerWhatsApp,
  isWhatsAppEnabled,
  sendText,
};
