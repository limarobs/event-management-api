const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const authMid = require('../middleware/authMiddleware');
const adminMid = require('../middleware/adminMiddleware');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.get('/me', authMid, authCtrl.me);
router.get('/users', authMid, adminMid, authCtrl.getAllUsers);

module.exports = router;