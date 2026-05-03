const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Technician = require('../models/Technician');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { getDashboardStats, getSalesAnalytics, getServiceAnalytics } = require('../services/analytics.service');

const getDashboard = catchAsync(async (req, res) => {
  const stats = await getDashboardStats(req.user.shop);
  res.json({ success: true, data: stats });
});

const getAnalytics = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const [sales, services] = await Promise.all([
    getSalesAnalytics(start, end, req.user.shop),
    getServiceAnalytics(start, end, req.user.shop),
  ]);

  res.json({ success: true, data: { sales, services } });
});

const getAllUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;

  const users = await User.find(query)
    .select('-refreshTokens')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: { users },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-refreshTokens');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({ success: true, message: 'User role updated', data: { user } });
});

const getAllProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const products = await Product.find()
    .populate('shop', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Product.countDocuments();

  res.json({
    success: true,
    data: { products },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: { orders },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getAllServices = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const services = await Service.find()
    .populate('shop', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Service.countDocuments();

  res.json({
    success: true,
    data: { services },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getAllReviews = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const reviews = await Review.find(query)
    .populate('user', 'name avatar')
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    data: { reviews },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const createCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });

  res.status(201).json({ success: true, message: 'Coupon created', data: { coupon } });
});

const getCoupons = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const coupons = await Coupon.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Coupon.countDocuments();

  res.json({
    success: true,
    data: { coupons },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const updateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  res.json({ success: true, message: 'Coupon updated', data: { coupon } });
});

const deleteCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  res.json({ success: true, message: 'Coupon deleted' });
});

const getTechnicians = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const technicians = await Technician.find(query)
    .populate('user', 'name email phone avatar')
    .populate('shop', 'name')
    .sort({ rating: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Technician.countDocuments(query);

  res.json({
    success: true,
    data: { technicians },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = {
  getDashboard,
  getAnalytics,
  getAllUsers,
  updateUserRole,
  getAllProducts,
  getAllOrders,
  getAllServices,
  getAllReviews,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getTechnicians,
};