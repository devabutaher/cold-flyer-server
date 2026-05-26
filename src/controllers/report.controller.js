const Customer = require("../models/Customer");
const Expense = require("../models/Expense");
const Technician = require("../models/Technician");
const Order = require("../models/Order");
const ServiceBooking = require("../models/ServiceBooking");
const catchAsync = require("../utils/catchAsync");

function buildDateFilter(year, month) {
  const filter = {};
  if (year) {
    const yearStr = String(year);
    filter.date = { $regex: `^${yearStr}` };
    if (month) {
      filter.date = { $regex: `^${yearStr}-${String(month).padStart(2, "0")}` };
    }
  }
  return filter;
}

const getReport = catchAsync(async (req, res) => {
  const { year, month } = req.query;
  const dateFilter = buildDateFilter(year, month);

  // Customer revenue
  const customerAgg = await Customer.aggregate([
    { $match: { status: "active", ...(dateFilter.date ? { installDate: dateFilter.date } : {}) } },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const customerRevenue = customerAgg[0]?.total || 0;
  const customerCount = customerAgg[0]?.count || 0;

  // E-commerce revenue
  const orderAgg = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        ...(dateFilter.date
          ? { createdAt: { $gte: new Date(year, (month || 1) - 1, 1), $lt: new Date(year, month || 12, 1) } }
          : {}),
      },
    },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
  ]);
  const orderRevenue = orderAgg[0]?.total || 0;
  const orderCount = orderAgg[0]?.count || 0;

  // Service booking revenue
  const bookingAgg = await ServiceBooking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        ...(dateFilter.date
          ? { createdAt: { $gte: new Date(year, (month || 1) - 1, 1), $lt: new Date(year, month || 12, 1) } }
          : {}),
      },
    },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
  ]);
  const bookingRevenue = bookingAgg[0]?.total || 0;
  const bookingCount = bookingAgg[0]?.count || 0;

  const totalRevenue = customerRevenue + orderRevenue + bookingRevenue;

  // Expenses
  const expenseAgg = await Expense.aggregate([
    { $match: dateFilter },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const totalExpenses = expenseAgg[0]?.total || 0;
  const expenseCount = expenseAgg[0]?.count || 0;

  // Salary (active workers)
  const salaryAgg = await Technician.aggregate([
    { $match: { isActive: true, salary: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$salary" }, count: { $sum: 1 } } },
  ]);
  const totalSalary = salaryAgg[0]?.total || 0;

  // Net profit
  const netProfit = totalRevenue - totalExpenses - totalSalary;

  // Service breakdown (from Customer model)
  const serviceBreakdown = await Customer.aggregate([
    { $match: dateFilter },
    { $group: { _id: "$service", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
    { $sort: { count: -1 } },
  ]);

  // Customers by income
  const topCustomers = await Customer.find(dateFilter)
    .sort({ amount: -1 })
    .limit(20)
    .select("name phone brand model service amount installDate status");

  // Expenses list
  const expenses = await Expense.find(dateFilter).sort({ date: -1 }).limit(100);

  // Active workers
  const workers = await Technician.find({ isActive: true })
    .populate("user", "name email phone")
    .select("nid bloodGroup salary");

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        totalExpenses,
        totalSalary,
        netProfit,
        customerRevenue,
        orderRevenue,
        bookingRevenue,
      },
      counts: {
        customers: customerCount,
        orders: orderCount,
        bookings: bookingCount,
        expenses: expenseCount,
        activeWorkers: workers.length,
      },
      serviceBreakdown,
      topCustomers,
      expenses,
      workers,
    },
  });
});

const getDuplicateCustomers = catchAsync(async (req, res) => {
  const { field = "phone" } = req.query;

  const groupField = field === "both" ? { phone: "$phone", address: "$address" } : `$${field}`;

  const duplicates = await Customer.aggregate([
    {
      $group: {
        _id: groupField,
        count: { $sum: 1 },
        customers: {
          $push: {
            _id: "$_id",
            name: "$name",
            phone: "$phone",
            address: "$address",
            brand: "$brand",
            model: "$model",
            service: "$service",
            amount: "$amount",
          },
        },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: { duplicates } });
});

module.exports = { getReport, getDuplicateCustomers };
