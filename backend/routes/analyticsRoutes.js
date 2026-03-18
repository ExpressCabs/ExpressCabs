const express = require('express');
const { endSession, ingestEventsBatch, startSession } = require('../controllers/analyticsController');

const router = express.Router();

router.post('/session/start', startSession);
router.post('/events/batch', ingestEventsBatch);
router.post('/session/end', endSession);

module.exports = router;
