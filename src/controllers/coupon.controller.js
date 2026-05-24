const Coupon = require('../models/Coupon');
const catchAsync = require('../utils/catchAsync');

const getFeaturedCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findOne({
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  })
    .sort({ discountValue: -1, createdAt: -1 })
    .select('code description discountType discountValue minOrderValue validUntil');

  if (!coupon) {
    return res.json({ success: true, data: null });
  }

  res.json({ success: true, data: { coupon } });
});

const lookupCoupon = catchAsync(async (req, res) => {
  const { code } = req.params;

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  }).select('code description discountType discountValue minOrderValue validUntil');

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
  }

  res.json({ success: true, data: { coupon } });
});

module.exports = { getFeaturedCoupon, lookupCoupon };
