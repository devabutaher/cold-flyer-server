const User = require('../models/User');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getUserNotifications, markAsRead, markAllAsRead } = require('../services/notification.service');

const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('cart')
    .populate({
      path: 'wishlist',
      select: 'name slug images price rating',
    });

  res.json({
    success: true,
    data: { user },
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { name, phone, dateOfBirth, gender } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone, dateOfBirth, gender },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

const updateAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload an image');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.path },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Avatar updated successfully',
    data: { avatar: user.avatar },
  });
});

const getAddresses = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses defaultAddress');

  res.json({
    success: true,
    data: { addresses: user.addresses },
  });
});

const addAddress = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(req.body);

  if (req.body.isDefault) {
    user.defaultAddress = user.addresses[user.addresses.length - 1]._id;
  }

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: { addresses: user.addresses },
  });
});

const updateAddress = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(id);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    user.defaultAddress = id;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Address updated successfully',
    data: { addresses: user.addresses },
  });
});

const deleteAddress = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(id);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  if (user.defaultAddress?.toString() === id) {
    user.defaultAddress = null;
  }

  address.deleteOne();
  await user.save();

  res.json({
    success: true,
    message: 'Address deleted successfully',
  });
});

const setDefaultAddress = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(id);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  user.addresses.forEach((addr) => (addr.isDefault = false));
  address.isDefault = true;
  user.defaultAddress = id;

  await user.save();

  res.json({
    success: true,
    message: 'Default address set successfully',
  });
});

const getOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Order.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: { orders, meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } },
  });
});

const getWishlist = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'name slug images price originalPrice rating reviewCount stockStatus',
  });

  res.json({
    success: true,
    data: { wishlist: user.wishlist },
  });
});

const addToWishlist = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);

  if (user.wishlist.includes(productId)) {
    throw ApiError.conflict('Product already in wishlist');
  }

  user.wishlist.push(productId);
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Added to wishlist',
  });
});

const removeFromWishlist = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();

  res.json({
    success: true,
    message: 'Removed from wishlist',
  });
});

const getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await getUserNotifications(req.user._id, parseInt(page), parseInt(limit));

  res.json({
    success: true,
    data: { notifications: result.notifications, meta: result },
  });
});

const markNotificationRead = catchAsync(async (req, res) => {
  const { id } = req.params;

  const notification = await markAsRead(id, req.user._id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

const markAllNotificationsRead = catchAsync(async (req, res) => {
  await markAllAsRead(req.user._id);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getOrders,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};