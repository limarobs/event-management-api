const express = require('express');
const router = express.Router();

const dashboardCtrl = require('../controllers/dashboardController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware.mjs').default;

// GET /api/dashboard/stats
router.get('/stats', authMid, adminMid, dashboardCtrl.getStats);
router.get('/stats/top-events', authMid, adminMid, dashboardCtrl.getTopEvents);
router.get('/stats/registrations-timeline', authMid, adminMid, dashboardCtrl.getRegistrationsTimeline);

module.exports = router;