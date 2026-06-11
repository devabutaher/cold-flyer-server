const Order = require("../models/Order");
const User = require("../models/User");
const ServiceBooking = require("../models/ServiceBooking");
const Attendance = require("../models/Attendance");
const Worker = require("../models/Worker");

const logger = require("../utils/logger");

const getModeratorStats = async () => {
  try {
    const [bookingCount, customerCount, recentBookings, serviceRevenue, topServices, categoryBreakdown, completionStats] = await Promise.all([
      ServiceBooking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.countDocuments({ role: "customer" }),
      ServiceBooking.find().sort({ createdAt: -1 }).limit(5).populate("service", "name"),
      ServiceBooking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      ServiceBooking.aggregate([
        { $lookup: { from: "services", localField: "service", foreignField: "_id", as: "svc" } },
        { $unwind: { path: "$svc", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$svc.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      ServiceBooking.aggregate([
        { $lookup: { from: "services", localField: "service", foreignField: "_id", as: "svc" } },
        { $unwind: { path: "$svc", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$svc.category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Promise.all([ServiceBooking.countDocuments(), ServiceBooking.countDocuments({ status: "completed" })]),
    ]);

    const [totalBookings, completedBookings] = completionStats;
    const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    const orderCount = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email");

    return {
      orderStatusDistribution: orderCount,
      bookingStatusDistribution: bookingCount,
      totalCustomers: customerCount,
      recentOrders,
      recentBookings,
      serviceRevenue: serviceRevenue[0]?.total || 0,
      topServices,
      serviceCategoryBreakdown: categoryBreakdown,
      completionRate,
      totalBookings,
      completedBookings,
    };
  } catch (error) {
    logger.error({ err: error }, "getModeratorStats failed");
    return {
      orderStatusDistribution: [],
      bookingStatusDistribution: [],
      totalCustomers: 0,
      recentOrders: [],
      recentBookings: [],
      serviceRevenue: 0,
      topServices: [],
      serviceCategoryBreakdown: [],
      completionRate: 0,
      totalBookings: 0,
      completedBookings: 0,
    };
  }
};

const getWorkerStats = async (userId) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const worker = await Worker.findOne({ user: userId });

    const [todayBookings, monthlyStats, attendanceSummary, revenueData] = await Promise.all([
      ServiceBooking.find({
        worker: worker?._id,
        scheduledDate: { $gte: todayStart, $lt: todayEnd },
      })
        .sort({ "scheduledTime.start": 1 })
        .populate("service", "name"),
      ServiceBooking.aggregate([
        { $match: { worker: worker?._id, createdAt: { $gte: monthStart } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Attendance.aggregate([
        { $match: { worker: worker?._id, date: { $gte: monthStart, $lte: now } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: { $sum: { $cond: [{ $ifNull: ["$inTime", false] }, 1, 0] } },
          },
        },
      ]),
      ServiceBooking.aggregate([
        { $match: { worker: worker?._id, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    const monthlyMap = {};
    monthlyStats.forEach((s) => (monthlyMap[s._id] = s.count));

    const avgRating = worker?.rating || 0;

    return {
      todayBookings,
      monthlyStats: monthlyMap,
      totalJobsThisMonth: monthlyStats.reduce((acc, s) => acc + s.count, 0),
      attendance: attendanceSummary[0] || { total: 0, present: 0 },
      averageRating: avgRating,
      revenueGenerated: revenueData[0]?.total || 0,
    };
  } catch (error) {
    logger.error({ err: error }, "getWorkerStats failed");
    return {
      todayBookings: [],
      monthlyStats: {},
      totalJobsThisMonth: 0,
      attendance: { total: 0, present: 0 },
      averageRating: 0,
      revenueGenerated: 0,
    };
  }
};

const getCustomerStats = async (userId) => {
  try {
    const [myOrders, myBookings] = await Promise.all([
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(10).select("orderNumber total status paymentStatus createdAt"),
      ServiceBooking.find({ user: userId }).sort({ createdAt: -1 }).limit(10).populate("service", "name"),
    ]);

    const [orderStatusDist, bookingStatusDist, totalSpentAgg, totalBookingSpent, upcoming] = await Promise.all([
      Order.aggregate([{ $match: { user: userId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      ServiceBooking.aggregate([{ $match: { user: userId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { user: userId, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      ServiceBooking.aggregate([
        { $match: { user: userId, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      ServiceBooking.find({ user: userId, status: { $in: ["pending", "confirmed", "scheduled", "in_progress"] } })
        .sort({ scheduledDate: 1 })
        .limit(3)
        .populate("service", "name"),
    ]);

    const totalSpent = (totalSpentAgg[0]?.total || 0) + (totalBookingSpent[0]?.total || 0);

    const activeBookingCount = bookingStatusDist
      .filter((s) => ["pending", "confirmed", "scheduled", "in_progress"].includes(s._id))
      .reduce((sum, s) => sum + s.count, 0);
    const pendingCount = bookingStatusDist.find((s) => s._id === "pending")?.count || 0;

    return {
      totalOrders: myOrders.length,
      totalBookings: myBookings.length,
      activeBookings: activeBookingCount,
      pendingBookings: pendingCount,
      totalSpent,
      serviceSpent: totalBookingSpent[0]?.total || 0,
      orderStatusDistribution: orderStatusDist,
      bookingStatusDistribution: bookingStatusDist,
      recentOrders: myOrders,
      recentBookings: myBookings,
      upcomingBookings: upcoming,
    };
  } catch (error) {
    logger.error({ err: error }, "getCustomerStats failed");
    return {
      totalOrders: 0,
      totalBookings: 0,
      activeBookings: 0,
      pendingBookings: 0,
      totalSpent: 0,
      serviceSpent: 0,
      orderStatusDistribution: [],
      bookingStatusDistribution: [],
      recentOrders: [],
      recentBookings: [],
      upcomingBookings: [],
    };
  }
};

module.exports = { getModeratorStats, getWorkerStats, getCustomerStats };
