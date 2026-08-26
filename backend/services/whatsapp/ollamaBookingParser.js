const { normalizeAuPhone } = require('../../lib/validators');
const { FARE_TYPES, PAYMENT_METHODS } = require('../../lib/dispatch/farePolicy');

const nullableText = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || /^(?:unknown|null|n\/a)$/i.test(text)) return null;
  return /^airport$/i.test(text) ? 'Melbourne Airport' : text;
};

const validateAiBooking = (candidate = {}) => {
  if (!candidate || candidate.intent !== 'CREATE_BOOKING') return null;
  const pickup = nullableText(candidate.pickup);
  const dropoff = nullableText(candidate.dropoff);
  const pickupDate = candidate.pickupAt ? new Date(candidate.pickupAt) : null;
  const pickupAt = pickupDate && !Number.isNaN(pickupDate.getTime()) ? pickupDate : null;
  const passengerCount = Number(candidate.passengerCount);
  const fareAmount = Number(candidate.fareAmount);
  const fareType = Object.values(FARE_TYPES).includes(candidate.fareType) ? candidate.fareType : null;
  const paymentMethod = Object.values(PAYMENT_METHODS).includes(candidate.paymentMethod)
    ? candidate.paymentMethod
    : PAYMENT_METHODS.UNKNOWN;
  const customerPhone = nullableText(candidate.customerPhone);
  const missing = [];
  if (!pickup) missing.push('pickup');
  if (!dropoff) missing.push('dropoff');
  if (!pickupAt) missing.push('pickupAt');

  return {
    intent: 'CREATE_BOOKING',
    pickup,
    dropoff,
    pickupAt,
    passengerCount: Number.isInteger(passengerCount) && passengerCount > 0 && passengerCount <= 20 ? passengerCount : null,
    customerName: nullableText(candidate.customerName),
    customerPhone: customerPhone ? normalizeAuPhone(customerPhone) : null,
    fareType,
    fareAmount: fareType && Number.isFinite(fareAmount) && fareAmount > 0 ? fareAmount : null,
    minimumFare: fareType === FARE_TYPES.MINIMUM && Number.isFinite(fareAmount) ? fareAmount : null,
    paymentMethod,
    boa: false,
    notes: nullableText(candidate.notes) ? [nullableText(candidate.notes)] : [],
    missing,
  };
};

const isEnabled = () => String(process.env.DISPATCH_AI_ENABLED || 'false').toLowerCase() === 'true'
  && String(process.env.DISPATCH_AI_PROVIDER || '').toLowerCase() === 'ollama';

const parseBookingWithAi = async (body, { fetchImpl = global.fetch, now = new Date() } = {}) => {
  if (!isEnabled() || typeof fetchImpl !== 'function') return null;
  const baseUrl = String(process.env.DISPATCH_AI_BASE_URL || 'http://host.docker.internal:11434').replace(/\/+$/, '');
  const timeoutMs = Math.max(1000, Number(process.env.DISPATCH_AI_TIMEOUT_MS || 60000));
  const prompt = [
    'Extract only facts explicitly present in this taxi booking message.',
    `Current time: ${now.toISOString()}. Timezone: Australia/Melbourne.`,
    'Return JSON with intent CREATE_BOOKING, pickup, dropoff, pickupAt as ISO 8601 with Melbourne offset, passengerCount, customerName, customerPhone, fareType, fareAmount, paymentMethod, notes.',
    'fareType is MINIMUM or COLLECT. paymentMethod is CASH, CARD, CASH_OR_CARD, CABCHARGE, MPTP_CARD, MPTP_CABCHARGE, or UNKNOWN. Use null for missing facts. Never infer a fare.',
    `Message: ${String(body || '').slice(0, 2000)}`,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.DISPATCH_AI_MODEL || 'qwen2.5:7b',
        stream: false,
        format: 'json',
        options: { temperature: 0, num_predict: 250 },
        prompt,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const parsed = JSON.parse(payload.response || '{}');
    return validateAiBooking(parsed);
  } catch (error) {
    console.error('Ollama booking fallback failed:', error.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { isEnabled, parseBookingWithAi, validateAiBooking };
