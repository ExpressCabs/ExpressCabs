// controllers/adminController.js
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const { getAnalyticsDebugSessions } = require('./analyticsController');

exports.adminLogin = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const { id, name } = admin;
        res.json({ user: { id, email, name, role: 'admin' } });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requireAdminDebugAccess = (req, res, next) => {
    const expectedKey = String(process.env.ADMIN_DEBUG_KEY || '').trim();
    const providedKey = String(req.headers['x-admin-debug-key'] || '').trim();

    if (!expectedKey) {
        return res.status(503).json({ message: 'Admin debug access is not configured' });
    }

    if (!providedKey || providedKey !== expectedKey) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    next();
};

exports.getAnalyticsDebugSessions = getAnalyticsDebugSessions;
