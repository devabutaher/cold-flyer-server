const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register, login, googleLogin, logout,
  refreshAccessToken, changePassword, getMe, authStatus, signout,
  getSessions, revokeSession, revokeAllSessions,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema, changePasswordSchema } = require('../validators/auth.validator');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many refresh requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email/password auth
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);

// Google OAuth
router.post('/google', googleLimiter, googleLogin);

// Token management
router.post('/logout', authenticate, logout);
router.get('/signout', signout);
router.post('/refresh', refreshLimiter, refreshAccessToken);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/me', authenticate, getMe);
router.get('/status', authStatus);

// Session management
router.get('/sessions', authenticate, getSessions);
router.delete('/sessions/:id', authenticate, revokeSession);
router.delete('/sessions', authenticate, revokeAllSessions);

module.exports = router;
