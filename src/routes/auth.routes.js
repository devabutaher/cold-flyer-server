const express = require('express');
const router = express.Router();
const { registerWithFirebase, loginWithFirebase, logout, refreshToken, changePassword, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Firebase auth routes - no validation (uses firebaseToken)
router.post('/firebase/login', loginWithFirebase);
router.post('/firebase/register', registerWithFirebase);

// User auth routes
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getMe);

module.exports = router;