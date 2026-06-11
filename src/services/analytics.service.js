const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const ServiceBooking = require("../models/ServiceBooking");

const logger = require("../utils/logger");

const getDashboardStats = async (startDate, endDate) => {
  try {
    const dateMatch = startDate && endDate
      ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      : {};
    const bookingDateMatch = startDate && endDate
      ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      : {};

    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      topProducts,
      orderStatusDist,
      bookingStatusDist,
      monthlyRevenue,
      customerGrowth,
      recentBookings,
      serviceRevenue,
      serviceAgg,
      bookingRevenueTrend,
      totalBookingsCount,
      completedBookingsCount,
    ] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.find().sort({ createdAt: -1 }).limit(10).populate("user", "name email"),
      Product.find({}).sort({ totalSold: -1 }).limit(10).select("name totalSold stock price images"),
      Order.aggregate([
        { $match: Object.keys(dateMatch).length ? dateMatch : {} },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ServiceBooking.aggregate([
        { $match: Object.keys(bookingDateMatch).length ? bookingDateMatch : {} },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: "paid", ...dateMatch } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: "customer", ...dateMatch } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ServiceBooking.find({ ...bookingDateMatch }).sort({ createdAt: -1 }).limit(10).populate("service", "name"),
      ServiceBooking.aggregate([
        { $match: { ...bookingDateMatch, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      ServiceBooking.aggregate([
        { $match: bookingDateMatch },
        { $lookup: { from: "services", localField: "service", foreignField: "_id", as: "svc" } },
        { $unwind: { path: "$svc", preserveNullAndEmptyArrays: true } },
        {
          $facet: {
            topServices: [
              { $group: { _id: "$svc.name", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            serviceCategoryBreakdown: [
              { $group: { _id: "$svc.category", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ]),
      ServiceBooking.aggregate([
        { $match: { ...bookingDateMatch, paymentStatus: "paid" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ServiceBooking.countDocuments(bookingDateMatch),
      ServiceBooking.countDocuments({ ...bookingDateMatch, status: "completed" }),
    ]);

    const topServices = serviceAgg?.[0]?.topServices || [];
    const serviceCategoryBreakdown = serviceAgg?.[0]?.serviceCategoryBreakdown || [];
    const completionRate = totalBookingsCount > 0 ? Math.round((completedBookingsCount / totalBookingsCount) * 100) : 0;

    return {
      revenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      recentBookings,
      topProducts,
      orderStatusDistribution: orderStatusDist,
      bookingStatusDistribution: bookingStatusDist,
      monthlyRevenue,
      customerGrowth,
      serviceRevenue: serviceRevenue[0]?.total || 0,
      topServices,
      serviceCategoryBreakdown,
      bookingRevenueTrend,
      completionRate,
      totalBookings: totalBookingsCount,
      completedBookings: completedBookingsCount,
    };
  } catch (error) {
    logger.error({ err: error }, "getDashboardStats failed");
    return {
      revenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
      recentOrders: [],
      recentBookings: [],
      topProducts: [],
      orderStatusDistribution: [],
      bookingStatusDistribution: [],
      monthlyRevenue: [],
      customerGrowth: [],
      serviceRevenue: 0,
      topServices: [],
      serviceCategoryBreakdown: [],
      bookingRevenueTrend: [],
      completionRate: 0,
      totalBookings: 0,
      completedBookings: 0,
    };
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
