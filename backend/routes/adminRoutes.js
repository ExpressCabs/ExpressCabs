// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { adminLogin, requireAdminAuth } = require('../controllers/adminController');
const { createDriverManually, listDrivers } = require('../controllers/driverController');
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
const { getAdminRides, assignRideToDriverByTaxiReg, updateRideStatus, markRideCompleted } = require('../controllers/rideController');

router.post('/login', adminLogin);
router.get('/drivers', requireAdminAuth, listDrivers);
router.post('/drivers', requireAdminAuth, createDriverManually);
router.get('/rides', requireAdminAuth, getAdminRides);
router.post('/rides/:id/assign-by-rego', requireAdminAuth, assignRideToDriverByTaxiReg);
router.post('/rides/:id/status', requireAdminAuth, updateRideStatus);
router.post('/rides/:id/complete', requireAdminAuth, (req, res) => {
  req.body = req.body || {};
  req.body.actor = 'admin';
  return markRideCompleted(req, res);
});
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
