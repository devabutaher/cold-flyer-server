const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const ServiceBooking = require("../models/ServiceBooking");

const logger = require("../utils/logger");

const getDashboardStats = async () => {
  try {
    const [totalRevenue, totalOrders, totalProducts, totalUsers, recentOrders, topProducts] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.find().sort({ createdAt: -1 }).limit(10).populate("user", "name email"),
      Product.find({}).sort({ totalSold: -1 }).limit(10).select("name totalSold stock"),
    ]);

    return {
      revenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      topProducts,
    };
  } catch (error) {
    logger.error({ err: error }, "getDashboardStats failed");
    return { revenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, recentOrders: [], topProducts: [] };
  }
};

const getSalesAnalytics = async (startDate, endDate) => {
  try {
    const matchQuery = {
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      paymentStatus: "paid",
    };

    const dailySales = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categorySales = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          total: { $sum: "$items.total" },
          count: { $sum: "$items.quantity" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return { dailySales, categorySales };
  } catch (error) {
    logger.error({ err: error }, "getSalesAnalytics failed");
    return { dailySales: [], categorySales: [] };
  }
};

const getServiceAnalytics = async (startDate, endDate) => {
  try {
    const matchQuery = {
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    const [totalBookings, completedBookings, totalRevenue, byStatus, byCategory] = await Promise.all([
      ServiceBooking.countDocuments(matchQuery),
      ServiceBooking.countDocuments({ ...matchQuery, status: "completed" }),
      ServiceBooking.aggregate([
        { $match: { ...matchQuery, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      ServiceBooking.aggregate([{ $match: matchQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      ServiceBooking.aggregate([
        { $match: matchQuery },
        { $lookup: { from: "services", localField: "service", foreignField: "_id", as: "serviceData" } },
        { $unwind: "$serviceData" },
        { $group: { _id: "$serviceData.category", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalBookings,
      completedBookings,
      revenue: totalRevenue[0]?.total || 0,
      byStatus,
      byCategory,
    };
  } catch (error) {
    logger.error({ err: error }, "getServiceAnalytics failed");
    return { totalBookings: 0, completedBookings: 0, revenue: 0, byStatus: [], byCategory: [] };
  }
};

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getServiceAnalytics,
};
