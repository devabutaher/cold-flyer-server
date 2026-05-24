const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const updateOrderCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { couponCode, removeCoupon } = req.body;

  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized');
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    throw ApiError.badRequest('Cannot change coupon once order is processing');
  }

  if (removeCoupon) {
    order.appliedCoupon = undefined;
    order.couponDiscount = 0;
    order.discount = 0;
    order.total = order.subtotal + (order.shippingCost || 0) + (order.tax || 0);
    await order.save();
    return res.json({ success: true, message: 'Coupon removed', data: { order } });
  }

  if (!couponCode) {
    throw ApiError.badRequest('Provide couponCode or removeCoupon');
  }

  const coupon = await Coupon.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });

  if (!coupon) throw ApiError.badRequest('Invalid or expired coupon');

  if (order.subtotal < (coupon.minOrderValue || 0)) {
    throw ApiError.badRequest(`Minimum order value of ৳${coupon.minOrderValue} required`);
  }

  if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }

  if (coupon.perUserLimit > 0) {
    const userUsageCount = await Order.countDocuments({
      user: req.user._id,
      'appliedCoupon.code': coupon.code,
      _id: { $ne: order._id },
      status: { $ne: 'cancelled' },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (order.subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discount = coupon.discountValue;
  }

  order.couponDiscount = discount;
  order.discount = discount;
  order.appliedCoupon = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
  order.total = order.subtotal - discount + (order.shippingCost || 0) + (order.tax || 0);

  await order.save();

  res.json({ success: true, message: 'Coupon updated', data: { order } });
});

module.exports = { updateOrderCoupon };
