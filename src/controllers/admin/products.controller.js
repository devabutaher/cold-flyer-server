const Product = require("../../models/Product");
const catchAsync = require("../../utils/catchAsync");

const getAllProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const products = await Product.find()
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Product.countDocuments();

  res.json({
    success: true,
    data: { products },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = { getAllProducts };
