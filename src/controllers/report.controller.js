const Order = require("../models/Order");
const Product = require("../models/Product");
const ServiceBooking = require("../models/ServiceBooking");
const Expense = require("../models/Expense");
const Worker = require("../models/Worker");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const getReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const totalOrders = await Order.countDocuments(dateFilter);
  const totalBookings = await ServiceBooking.countDocuments(dateFilter);
  const totalExpenses = await Expense.countDocuments(dateFilter);
  const totalWorkers = await Worker.countDocuments({ isActive: true });

  // Total revenue from paid orders
  const orderRevenue = await Order.aggregate([
    { $match: { ...dateFilter, paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);

  const bookingRevenue = await ServiceBooking.aggregate([
    { $match: { ...dateFilter, paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);

  const salaryAgg = await Worker.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, total: { $sum: "$salary" } } },
  ]);

  const expenseAgg = await Expense.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const workers = await Worker.find({ isActive: true })
    .populate("user", "name email phone")
    .select("employeeId specializations salary status")
    .lean();

  res.json({
    success: true,
    data: {
      summary: {
        totalOrders,
        totalBookings,
        totalExpenses,
        totalWorkers,
        orderRevenue: orderRevenue[0]?.total || 0,
        bookingRevenue: bookingRevenue[0]?.total || 0,
        totalSalary: salaryAgg[0]?.total || 0,
        totalExpenseAmount: expenseAgg[0]?.total || 0,
      },
      workers,
    },
  });
});

const getDuplicateCustomers = catchAsync(async (req, res) => {
  const Customer = require("../models/Customer");
  const duplicates = await Customer.aggregate([
    { $group: { _id: { phone: "$phone" }, count: { $sum: 1 }, customers: { $push: { _id: "$_id", name: "$name", email: "$email", phone: "$phone" } } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  res.json({ success: true, data: { duplicates } });
});

module.exports = { getReport, getDuplicateCustomers };
