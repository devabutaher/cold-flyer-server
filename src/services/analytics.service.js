const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ServiceBooking = require('../models/ServiceBooking');

const getDashboardStats = async (shopId = null) => {
  const matchQuery = shopId ? { shop: shopId } : {};

  const [
    totalRevenue,
    totalOrders,
    totalProducts,
    totalUsers,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'paid', ...matchQuery } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(matchQuery),
    Product.countDocuments(shopId ? { shop: shopId } : {}),
    User.countDocuments({ role: 'customer' }),
    Order.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email'),
    Product.find({})
      .sort({ totalSold: -1 })
      .limit(10)
      .select('name totalSold stock'),
  ]);

  return {
    revenue: totalRevenue[0]?.total || 0,
    totalOrders,
    totalProducts,
    totalUsers,
    recentOrders,
    topProducts,
  };
};

const getSalesAnalytics = async (startDate, endDate, shopId = null) => {
  const matchQuery = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    paymentStatus: 'paid',
  };
  if (shopId) matchQuery.shop = shopId;

  const dailySales = await Order.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const categorySales = await Order.aggregate([
    { $match: matchQuery },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$product.category',
        total: { $sum: '$items.total' },
        count: { $sum: '$items.quantity' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return { dailySales, categorySales };
};

const getServiceAnalytics = async (startDate, endDate, shopId = null) => {
  const matchQuery = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
  };
  if (shopId) matchQuery.shop = shopId;

  const [
    totalBookings,
    completedBookings,
    totalRevenue,
    byStatus,
    byCategory,
  ] = await Promise.all([
    ServiceBooking.countDocuments(matchQuery),
    ServiceBooking.countDocuments({ ...matchQuery, status: 'completed' }),
    ServiceBooking.aggregate([
      { $match: { ...matchQuery, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    ServiceBooking.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ServiceBooking.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceData' } },
      { $unwind: '$serviceData' },
      { $group: { _id: '$serviceData.category', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalBookings,
    completedBookings,
    revenue: totalRevenue[0]?.total || 0,
    byStatus,
    byCategory,
  };
};

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getServiceAnalytics,
};