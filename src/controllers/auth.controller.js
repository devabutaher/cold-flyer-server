const User = require('../models/User');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../utils/generateToken');
const { verifyGoogleToken } = require('../config/google');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const checkAccountLockout = (user) => {
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw ApiError.tooManyRequests(`Account temporarily locked. Try again in ${remainingMinutes} minutes`);
  }
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('accessToken', { path: '/' });
};

const sendUserResponse = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Registration successful' : 'Login successful',
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
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: 'user',
  });

  const cart = await Cart.create({ user: user._id, items: [] });
  user.cart = cart._id;
  await user.save();

  sendUserResponse(res, user, 201);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
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
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      refreshTokens: [],
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
    },
    $inc: { tokenVersion: 1 },
  });

  sendUserResponse(res, user);
});

const googleLogin = catchAsync(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw ApiError.badRequest('Google ID token is required');
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw ApiError.badRequest('Google sign-in is not configured');
  }

  const payload = await verifyGoogleToken(idToken);
  const { email, name, picture, sub } = payload;

  if (!email) {
    throw ApiError.badRequest('Google account must have an email');
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      phone: '',
      password: sub,
      avatar: picture || null,
      role: 'user',
      isEmailVerified: true,
    });

    const cart = await Cart.create({ user: user._id, items: [] });
    user.cart = cart._id;
    await user.save();
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      refreshTokens: [],
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
      avatar: picture || user.avatar,
    },
    $inc: { tokenVersion: 1 },
  });

  sendUserResponse(res, user);
});

const logout = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (req.user && token) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: token },
    });
  }

  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

const refreshAccessToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('Refresh token not found');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('User not found or inactive');
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const updated = await User.findOneAndUpdate(
    { _id: user._id, refreshTokens: token, isActive: true },
    {
      $set: { 'refreshTokens.$': newRefreshToken },
      $inc: { tokenVersion: 1 },
    },
    { new: true }
  );

  if (!updated) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  setAuthCookies(res, accessToken, newRefreshToken);

  res.json({
    success: true,
    data: { accessToken },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again.',
  });
});

const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('cart')
    .populate('wishlist');

  res.json({
    success: true,
    data: { user },
  });
});

const getSessions = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('refreshTokens lastLogin');

  const sessions = user.refreshTokens.map((token, index) => ({
    id: index,
    createdAt: null,
    isCurrent: token === req.cookies.refreshToken,
  }));

  res.json({
    success: true,
    data: { sessions, total: sessions.length },
  });
});

const revokeSession = catchAsync(async (req, res) => {
  const { id } = req.params;
  const sessionIndex = parseInt(id, 10);

  const user = await User.findById(req.user._id);

  if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= user.refreshTokens.length) {
    throw ApiError.notFound('Session not found');
  }

  const isCurrentSession = user.refreshTokens[sessionIndex] === req.cookies.refreshToken;

  user.refreshTokens.splice(sessionIndex, 1);
  await user.save();

  if (isCurrentSession) {
    clearAuthCookies(res);
  }

  res.json({
    success: true,
    message: isCurrentSession ? 'Current session revoked' : 'Session revoked',
  });
});

const revokeAllSessions = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshTokens: [] },
    $inc: { tokenVersion: 1 },
  });

  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'All sessions revoked. Please login again.',
  });
});

const authStatus = catchAsync(async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.json({ success: true, data: { authenticated: false } });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return res.json({ success: true, data: { authenticated: false } });
  }

  const user = await User.findById(decoded.userId).select('name email phone role avatar');
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
      },
    },
  });
});

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  refreshAccessToken,
  changePassword,
  getMe,
  authStatus,
  getSessions,
  revokeSession,
  revokeAllSessions,
};
