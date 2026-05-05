const express = require('express');
const router = express.Router();

const dashboardCtrl = require('../controllers/dashboardController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware');

// GET /api/dashboard/stats
router.get('/stats', authMid, adminMid, dashboardCtrl.getStats);

module.exports = router;