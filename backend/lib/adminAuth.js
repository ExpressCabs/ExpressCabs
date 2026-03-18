const crypto = require('crypto');

const DEFAULT_EXPIRY_MS = 1000 * 60 * 60 * 12;

const getSecret = () => String(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_DEBUG_KEY || '').trim();
const hasAdminAuthSecret = () => Boolean(getSecret());

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

const sign = (payload) => {
  const secret = getSecret();
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured');
  }

  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
};

const createAdminToken = (admin) => {
  const expiresAt = Date.now() + DEFAULT_EXPIRY_MS;
  const payload = encode({
    sub: admin.id,
    email: admin.email,
    role: 'admin',
    expiresAt,
  });

  return `${payload}.${sign(payload)}`;
};

const verifyAdminToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  try {
    if (!hasAdminAuthSecret() || sign(payload) !== signature) {
      return null;
    }

    const decoded = decode(payload);
    if (decoded.expiresAt < Date.now() || decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createAdminToken,
  hasAdminAuthSecret,
  verifyAdminToken,
};
