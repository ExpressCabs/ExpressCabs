const FARE_TYPES = Object.freeze({
  MINIMUM: 'MINIMUM',
  COLLECT: 'COLLECT',
});

const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  CARD: 'CARD',
  CASH_OR_CARD: 'CASH_OR_CARD',
  CABCHARGE: 'CABCHARGE',
  MPTP_CARD: 'MPTP_CARD',
  MPTP_CABCHARGE: 'MPTP_CABCHARGE',
  UNKNOWN: 'UNKNOWN',
});

const DISPATCH_MINIMUM_TIERS = Object.freeze([40, 50, 75, 100, 125]);

const parseFareInstruction = (text = '') => {
  const match = String(text).match(/\b(min(?:imum)?|collect)(?:\s*fare)?\s*:?\s*\$?\s*(\d+(?:\.\d{1,2})?)\b/i);
  if (!match) return { fareType: null, fareAmount: null };
  return {
    fareType: /^collect$/i.test(match[1]) ? FARE_TYPES.COLLECT : FARE_TYPES.MINIMUM,
    fareAmount: Number(match[2]),
  };
};

const parsePaymentMethod = (text = '') => {
  const value = String(text);
  if (/\bmptp\s*(?:\/|or)?\s*cab\s*charge\b/i.test(value)) return PAYMENT_METHODS.MPTP_CABCHARGE;
  if (/\bmptp\s*(?:\/|or)?\s*card\b/i.test(value)) return PAYMENT_METHODS.MPTP_CARD;
  if (/\bcab\s*charge\b/i.test(value)) return PAYMENT_METHODS.CABCHARGE;
  if (/\bcash\s*(?:\/|or)\s*card\b|\bcard\s*(?:\/|or)\s*cash\b/i.test(value)) return PAYMENT_METHODS.CASH_OR_CARD;
  if (/\bcash\b/i.test(value)) return PAYMENT_METHODS.CASH;
  if (/\bcard\b|\beftpos\b/i.test(value)) return PAYMENT_METHODS.CARD;
  return PAYMENT_METHODS.UNKNOWN;
};

const toDispatchMinimumTier = (calculatedFare) => {
  const fare = Number(calculatedFare);
  if (!Number.isFinite(fare) || fare <= 0) return { fareType: null, fareAmount: null, boa: false };

  const nextTier = DISPATCH_MINIMUM_TIERS.find((tier) => tier >= fare);
  if (!nextTier) {
    return { fareType: FARE_TYPES.MINIMUM, fareAmount: DISPATCH_MINIMUM_TIERS.at(-1), boa: false };
  }
  const previousTier = [...DISPATCH_MINIMUM_TIERS].reverse().find((tier) => tier <= fare) || DISPATCH_MINIMUM_TIERS[0];
  const shouldBump = nextTier > previousTier && nextTier - fare <= 6;
  return {
    fareType: FARE_TYPES.MINIMUM,
    fareAmount: shouldBump ? nextTier : previousTier,
    boa: shouldBump,
  };
};

module.exports = {
  DISPATCH_MINIMUM_TIERS,
  FARE_TYPES,
  PAYMENT_METHODS,
  parseFareInstruction,
  parsePaymentMethod,
  toDispatchMinimumTier,
};
