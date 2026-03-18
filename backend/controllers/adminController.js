// controllers/adminController.js
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const { createAdminToken, hasAdminAuthSecret, verifyAdminToken } = require('../lib/adminAuth');

exports.adminLogin = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!hasAdminAuthSecret()) {
        return res.status(500).json({
            message: 'Admin authentication is not configured',
            code: 'ADMIN_AUTH_NOT_CONFIGURED',
        });
    }

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const { id, name } = admin;
        res.json({ user: { id, email, name, role: 'admin' }, token: createAdminToken({ id, email }) });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.requireAdminAuth = (req, res, next) => {
    if (!hasAdminAuthSecret()) {
        return res.status(503).json({
            message: 'Admin authentication is not configured',
            code: 'ADMIN_AUTH_NOT_CONFIGURED',
        });
    }

    const bearerHeader = String(req.headers.authorization || '');
    const token = bearerHeader.startsWith('Bearer ')
        ? bearerHeader.slice('Bearer '.length).trim()
        : String(req.headers['x-admin-token'] || '').trim();

    const admin = verifyAdminToken(token);
    if (!admin) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    req.admin = admin;
    next();
};
