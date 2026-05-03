const User = require('../models/User');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const admin = require('../config/firebase');

const isAdminEmail = (email) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
};

const verifyFirebaseToken = async (idToken) => {
  try {
    if (!admin.apps.length) {
      throw ApiError.internal('Firebase not configured on server');
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error.code, error.message);
    throw ApiError.unauthorized('Invalid Firebase token');
  }
};

const registerWithFirebase = catchAsync(async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    throw ApiError.badRequest('Firebase token is required');
  }

  const decodedToken = await verifyFirebaseToken(firebaseToken);
  const { uid, email, name, picture } = decodedToken;

  let user = await User.findOne({ email });

  if (user) {
    throw ApiError.conflict('User already exists');
  }

  const role = isAdminEmail(email) ? 'admin' : 'user';

  user = await User.create({
    name: name || email.split('@')[0],
    email,
    phone: '',
    password: uid,
    avatar: picture || null,
    role,
    isEmailVerified: true,
  });

  const cart = await Cart.create({ user: user._id, items: [] });
  user.cart = cart._id;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
    },
  });
});

const loginWithFirebase = catchAsync(async (req, res) => {
  const { firebaseToken } = req.body;

  if (!firebaseToken) {
    throw ApiError.badRequest('Firebase token is required');
  }

  const decodedToken = await verifyFirebaseToken(firebaseToken);
  const { uid, email, name, picture } = decodedToken;

  let user = await User.findOne({ email });

  if (!user) {
    // Check if email is in admin list
    const role = isAdminEmail(email) ? 'admin' : 'user';
    
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      phone: '',
      password: uid,
      avatar: picture || null,
      role,
      isEmailVerified: true,
    });

    const cart = await Cart.create({ user: user._id, items: [] });
    user.cart = cart._id;
    await user.save();
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Use findOneAndUpdate to avoid version conflicts
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken },
    $set: { lastLogin: new Date() },
    $inc: { tokenVersion: 1 }
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (req.user && refreshToken) {
    req.user.refreshTokens = req.user.refreshTokens.filter((t) => t !== refreshToken);
    await req.user.save();
  }

  res.clearCookie('refreshToken');

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw ApiError.unauthorized('Refresh token not found');
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.userId);

  if (!user || !user.refreshTokens.includes(token)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { accessToken },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
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

module.exports = {
  registerWithFirebase,
  loginWithFirebase,
  logout,
  refreshToken,
  changePassword,
  getMe,
};