const Expense = require('../models/Expense');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getExpenses = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, startDate, endDate, category } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  if (category) query.category = category;

  const expenses = await Expense.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Expense.countDocuments(query);
  const totalAmount = await Expense.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.json({
    success: true,
    data: { expenses },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      totalAmount: totalAmount[0]?.total || 0,
    },
  });
});

const getExpense = catchAsync(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw ApiError.notFound('Expense not found');
  res.json({ success: true, data: { expense } });
});

const createExpense = catchAsync(async (req, res) => {
  const { item, amount, date, category } = req.body;
  if (!item || amount === undefined || !date) {
    throw ApiError.badRequest('Item, amount, and date are required');
  }

  const expense = await Expense.create({
    item,
    amount,
    date,
    category: category || 'other',
    addedBy: req.user?.name || 'System',
    addedDate: new Date().toISOString().split('T')[0],
  });

  res.status(201).json({ success: true, data: { expense } });
});

const updateExpense = catchAsync(async (req, res) => {
  const { item, amount, date, category } = req.body;
  const expense = await Expense.findById(req.params.id);
  if (!expense) throw ApiError.notFound('Expense not found');

  if (item !== undefined) expense.item = item;
  if (amount !== undefined) expense.amount = amount;
  if (date !== undefined) expense.date = date;
  if (category !== undefined) expense.category = category;
  expense.editedBy = req.user?.name || 'System';
  expense.editedDate = new Date().toISOString().split('T')[0];

  await expense.save();
  res.json({ success: true, data: { expense } });
});

const deleteExpense = catchAsync(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);
  if (!expense) throw ApiError.notFound('Expense not found');
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense };
