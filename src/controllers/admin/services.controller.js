const Service = require('../../models/Service');
const catchAsync = require('../../utils/catchAsync');

const getAllServices = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const services = await Service.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Service.countDocuments();

  res.json({
    success: true,
    data: { services },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = { getAllServices };
