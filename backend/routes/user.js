const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);
router.get('/dashboard', authMiddleware, userCtrl.dashboard);
router.post('/web3/login', userCtrl.web3Login);

module.exports = router;
