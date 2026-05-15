const Order = require('../../models/Order');
const catchAsync = require('../../utils/catchAsync');

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

module.exports = { getAllOrders };
