const crypto = require('crypto');

const DEFAULT_SALT = 'express-cabs-analytics';

const hashIp = (ip) => {
  const normalizedIp = typeof ip === 'string' ? ip.trim() : '';
  if (!normalizedIp) {
    return null;
  }

  const salt = process.env.ANALYTICS_IP_SALT || DEFAULT_SALT;
  return crypto.createHash('sha256').update(`${salt}:${normalizedIp}`).digest('hex');
};

module.exports = {
  hashIp,
};
