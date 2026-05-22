const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');

const getAllUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;

  const users = await User.find(query)
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

  const user = await User.findByIdAndUpdate(id, { role }, { new: true });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({ success: true, message: 'User role updated', data: { user } });
});

module.exports = { getAllUsers, updateUserRole };
