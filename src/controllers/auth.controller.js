const User = require("../models/User");
const Cart = require("../models/Cart");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { generateAccessToken, verifyAccessToken, parseDurationToMs } = require("../utils/generateToken");
const { verifyGoogleToken } = require("../config/google");
const crypto = require("crypto");
const { sendVerificationCode: sendCodeEmail, sendPasswordResetEmail } = require("../services/email.service");
const { uploadGoogleAvatar } = require("../services/cloudinary.service");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const checkAccountLockout = (user) => {
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw ApiError.tooManyRequests(`Account temporarily locked. Try again in ${remainingMinutes} minutes`);
  }
};

const ACCESS_TOKEN_MAX_AGE =
  parseDurationToMs(process.env.JWT_EXPIRES_IN) ||
  parseDurationToMs(process.env.NODE_ENV === "production" ? "1h" : "30d");

const setAuthCookies = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", { path: "/" });
};

const sendUserResponse = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user);

  setAuthCookies(res, accessToken);

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? "Registration successful" : "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
};

const register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const role = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL ? "admin" : "user";

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || "",
    role,
  });

  const cart = await Cart.create({ user: user._id, items: [] });
  user.cart = cart._id;
  await user.save();

  sendUserResponse(res, user, 201);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  checkAccountLockout(user);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const attempts = (user.loginAttempts || 0) + 1;
    const updates = { loginAttempts: attempts };
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    }
    await User.findByIdAndUpdate(user._id, { $set: updates });
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated");
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
    },
  });

  sendUserResponse(res, user);
});

const googleLogin = catchAsync(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw ApiError.badRequest("Google ID token is required");
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw ApiError.badRequest("Google sign-in is not configured");
  }

  const payload = await verifyGoogleToken(idToken);
  const { email, name, picture, sub } = payload;

  if (!email) {
    throw ApiError.badRequest("Google account must have an email");
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      phone: "",
      password: sub,
      avatar: await uploadGoogleAvatar(picture),
      role: "user",
      provider: "google",
      isEmailVerified: true,
    });

    const cart = await Cart.create({ user: user._id, items: [] });
    user.cart = cart._id;
    await user.save();
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated");
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
      avatar: (await uploadGoogleAvatar(picture)) || user.avatar,
    },
  });

  sendUserResponse(res, user);
});

const logout = catchAsync(async (req, res) => {
  clearAuthCookies(res);

  res.json({
    success: true,
    message: "Logout successful",
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    throw ApiError.badRequest("New password must be at least 8 characters");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  clearAuthCookies(res);

  res.json({
    success: true,
    message: "Password changed successfully. Please login again.",
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate("cart").populate("wishlist");

  res.json({
    success: true,
    data: { user },
  });
});

const authStatus = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.startsWith("Bearer")
    ? req.headers.authorization.split(" ")[1]
    : req.cookies.accessToken;
  if (!token) {
    return res.json({ success: true, data: { authenticated: false } });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return res.json({ success: true, data: { authenticated: false } });
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    return res.json({ success: true, data: { authenticated: false } });
  }

  return res.json({
    success: true,
    data: {
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        addresses: user.addresses,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        provider: user.provider,
        emailVerified: user.emailVerified,
      },
    },
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether the email exists for security
    return res.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user.email, user.name, resetToken);

  res.json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  if (!password || password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  clearAuthCookies(res);

  res.json({
    success: true,
    message: "Password reset successful. Please login with your new password.",
  });
});

const sendVerificationCode = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.isEmailVerified) {
    throw ApiError.badRequest("Email is already verified");
  }

  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  const hashed = crypto.createHash("sha256").update(code).digest("hex");

  user.emailVerificationToken = hashed;
  user.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  await sendCodeEmail(user.email, user.name, code);

  res.json({ success: true, message: "Verification code sent to your email" });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw ApiError.badRequest("Verification code is required");
  }

  const hashed = crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");

  const user = await User.findOne({
    _id: req.user._id,
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification code");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Email verified successfully" });
});

module.exports = {
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
};
