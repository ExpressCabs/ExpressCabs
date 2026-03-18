require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { spawnSync } = require('child_process');
const prisma = require('./lib/prisma');
const securityHeaders = require('./middleware/securityHeaders');
const { createRateLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');
const { hasAdminAuthSecret } = require('./lib/adminAuth');

const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');
const otpRoutes = require('./routes/otpRoutes');
const blogRoutes = require('./routes/blogRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes');
const adminRoutes = require('./routes/adminRoutes');
const airportMetricsRouter = require('./routes/airportMetrics');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
let server;

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin && !isProduction) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (origin && allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyFn: (req) => `api:${req.ip}`,
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  keyFn: (req) => `auth:${req.ip}`,
});

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/api', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/drivers/login', authLimiter);
app.use('/api/admin/login', authLimiter);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err);
    return res.status(503).json({ status: 'degraded' });
  }
});

app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api', sitemapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', airportMetricsRouter);
app.use('/api/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const runStartupMigrations = () => {
  if (process.env.RUN_STARTUP_MIGRATIONS === 'false') {
    return;
  }

  const prismaCliPath = require.resolve('prisma/build/index.js');
  const result = spawnSync(process.execPath, [prismaCliPath, 'migrate', 'deploy'], {
    cwd: __dirname,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Prisma migrate deploy failed with exit code ${result.status}`);
  }
};

const startServer = async () => {
  try {
    runStartupMigrations();
    if (!hasAdminAuthSecret()) {
      console.warn('ADMIN_SESSION_SECRET is not configured. Admin login and analytics auth will not work until it is set.');
    }
    server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log('Shutting down server...');
  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
    return;
  }
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

startServer();
