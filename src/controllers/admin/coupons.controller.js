const Coupon = require('../../models/Coupon');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');

const createCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });

  res.status(201).json({ success: true, message: 'Coupon created', data: { coupon } });
});

const getCoupons = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const coupons = await Coupon.find()
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Coupon.countDocuments();

  res.json({
    success: true,
    data: { coupons },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const updateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  res.json({ success: true, message: 'Coupon updated', data: { coupon } });
});

const deleteCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  res.json({ success: true, message: 'Coupon deleted' });
});

const toggleCouponStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, data: { coupon } });
});

module.exports = { createCoupon, getCoupons, updateCoupon, deleteCoupon, toggleCouponStatus };
