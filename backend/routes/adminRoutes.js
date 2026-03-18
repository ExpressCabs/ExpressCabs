// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { adminLogin, requireAdminAuth } = require('../controllers/adminController');
const {
  getBlockSignals,
  getFunnel,
  getLiveSessions,
  getOverview,
  getSessionDetail,
  getSessions,
  getSourceBreakdown,
  getSuburbInsights,
  getTrafficQuality,
  updateBlockSignal,
} = require('../controllers/adminAnalyticsController');

router.post('/login', adminLogin);
router.get('/analytics/overview', requireAdminAuth, getOverview);
router.get('/analytics/live-sessions', requireAdminAuth, getLiveSessions);
router.get('/analytics/funnel', requireAdminAuth, getFunnel);
router.get('/analytics/source-breakdown', requireAdminAuth, getSourceBreakdown);
router.get('/analytics/suburb-insights', requireAdminAuth, getSuburbInsights);
router.get('/analytics/traffic-quality', requireAdminAuth, getTrafficQuality);
router.get('/analytics/sessions', requireAdminAuth, getSessions);
router.get('/analytics/session/:sessionId', requireAdminAuth, getSessionDetail);
router.get('/analytics/block-signals', requireAdminAuth, getBlockSignals);
router.post('/analytics/block-signals/:id/status', requireAdminAuth, updateBlockSignal);
router.post('/analytics/block-signals/:id/note', requireAdminAuth, updateBlockSignal);

module.exports = router;
