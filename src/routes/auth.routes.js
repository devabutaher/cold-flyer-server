const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  googleLogin,
  logout,
  changePassword,
  getMe,
  authStatus,
  sendVerificationCode,
  verifyEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many registration attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many password reset attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email/password auth
router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);

// Google OAuth
router.post("/google", googleLimiter, googleLogin);

// Session
router.post("/logout", authenticate, logout);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);
router.get("/me", authenticate, getMe);
router.get("/status", authStatus);

// Email verification
router.post("/send-verification-code", authenticate, sendVerificationCode);
router.post("/verify-email", authenticate, verifyEmail);

// Password reset (no auth required)
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);

module.exports = router;
