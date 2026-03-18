// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { adminLogin, getAnalyticsDebugSessions, requireAdminDebugAccess } = require('../controllers/adminController');

router.post('/login', adminLogin);
router.get('/analytics/sessions', requireAdminDebugAccess, getAnalyticsDebugSessions);

module.exports = router;
