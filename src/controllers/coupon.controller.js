const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const { validateCouponScope, computeCouponDiscount } = require('../utils/coupon-scope');

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
  }).select('code description discountType discountValue maxDiscount minOrderValue validUntil applicableTo productIds serviceIds categoryIds brandIds firstOrderOnly minItemCount excludedProductIds excludedCategoryIds');

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
  }

  res.json({ success: true, data: { coupon } });
});

const getActiveCoupons = catchAsync(async (req, res) => {
  const { limit } = req.query;

  const query = Coupon.find({
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  })
    .sort({ discountValue: -1, createdAt: -1 })
    .select('code description discountType discountValue maxDiscount minOrderValue validUntil applicableTo productIds serviceIds categoryIds brandIds firstOrderOnly minItemCount showOnBanner excludedProductIds excludedCategoryIds');

  if (limit) query.limit(parseInt(limit, 10));

  const coupons = await query;

  res.json({ success: true, data: { coupons } });
});

const autoApplyCoupon = catchAsync(async (req, res) => {
  const { subtotal = 0, itemCount = 0, items } = req.body;

  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
    showOnBanner: { $ne: false },
    discountType: { $in: ['percentage', 'fixed', 'free_shipping'] },
  })
    .sort({ discountValue: -1, createdAt: -1 })
    .select('code description discountType discountValue maxDiscount minOrderValue minItemCount applicableTo productIds serviceIds categoryIds brandIds firstOrderOnly excludedProductIds excludedCategoryIds');

  for (const coupon of coupons) {
    if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) continue;
    if (coupon.minItemCount > 0 && itemCount < coupon.minItemCount) continue;

    if (req.user) {
      if (coupon.firstOrderOnly && req.user._id) {
        const orderCount = await Order.countDocuments({ user: req.user._id });
        if (orderCount > 0) continue;
      }
    }

    const scopeResult = validateCouponScope(coupon, items || []);
    if (!scopeResult.valid) continue;

    return res.json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
          calculatedDiscount: computeCouponDiscount(coupon, scopeResult.matchingSubtotal),
        },
      },
    });
  }

  res.json({ success: true, data: null });
});

module.exports = { getFeaturedCoupon, lookupCoupon, getActiveCoupons, autoApplyCoupon };
