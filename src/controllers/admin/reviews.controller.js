const Review = require("../../models/Review");
const catchAsync = require("../../utils/catchAsync");

const getAllReviews = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const reviews = await Review.find(query)
    .populate("user", "name avatar")
    .populate("product", "name")
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

module.exports = { getAllReviews };
