const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const { validateCouponScope, computeCouponDiscount } = require("../utils/coupon-scope");
const catchAsync = require("../utils/catchAsync");
const {
  sendOrderConfirmationEmail,
  sendNewOrderAlertToAdmin,
} = require("../services/email.service");

const createOrder = catchAsync(async (req, res) => {
  const {
    items: requestItems,
    shippingAddress,
    billingAddress,
    paymentMethod,
    isPickup,
    pickupShop,
    notes,
    couponCode,
  } = req.body;

  const itemsToProcess = (requestItems && requestItems.length > 0) ? requestItems : [];

  if (!itemsToProcess || itemsToProcess.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of itemsToProcess) {
    const productId = item.product?._id || item.product || item.productId;

    if (!productId) {
      throw ApiError.badRequest(`Invalid product ID: ${item.name || item.productId}`);
    }

    let product = await Product.findById(productId);
    if (!product && productId) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Product ${item.name || item.productId} is no longer available`);
    }

    const qty = item.quantity;
    if (product.stock < qty) {
      throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
    }

    const itemTotal = product.price * qty;
    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      image: product.images?.[0]?.url,
      price: product.price,
      quantity: qty,
      total: itemTotal,
    });

    subtotal += itemTotal;

    product.stock -= qty;
    product.totalSold = (product.totalSold || 0) + qty;
    await product.save();
  }

  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (coupon) {
      if (subtotal < coupon.minOrderValue) {
        throw ApiError.badRequest(`Minimum order value of ৳${coupon.minOrderValue} required for coupon ${coupon.code}`);
      }

      if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
        throw ApiError.badRequest("This coupon has reached its usage limit");
      }

      if (coupon.perUserLimit > 0) {
        const userUsageCount = await Order.countDocuments({
          user: req.user._id,
          "appliedCoupon.code": coupon.code,
          status: { $ne: "cancelled" },
        });
        if (userUsageCount >= coupon.perUserLimit) {
          throw ApiError.badRequest("You have already used this coupon the maximum number of times");
        }
      }

      if (coupon.firstOrderOnly) {
        const userOrderCount = await Order.countDocuments({ user: req.user._id });
        if (userOrderCount > 0) {
          throw ApiError.badRequest("This coupon is for first-time customers only");
        }
      }

      const scopeResult = validateCouponScope(coupon, orderItems);
      if (!scopeResult.valid) {
        throw ApiError.badRequest(scopeResult.reason);
      }

      discount = computeCouponDiscount(coupon, scopeResult.matchingSubtotal);

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      };
    }
  }

  const shippingCost = isPickup ? 0 : subtotal > 100 ? 0 : 10;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shippingCost + tax;

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    itemCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    discount,
    couponDiscount: discount,
    appliedCoupon,
    shippingCost,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    shippingAddress,
    billingAddress,
    paymentMethod: paymentMethod || "card",
    isPickup: isPickup || false,
    pickupShop,
    notes,
    source: "website",
  });

  req.user.orders.push(order._id);
  await req.user.save();

  // Send confirmation to customer
  sendOrderConfirmationEmail(req.user.email, req.user.name, order).catch((err) =>
    logger.error({ err, orderId: order._id }, "sendOrderConfirmationEmail failed"),
  );

  // Alert super admin
  sendNewOrderAlertToAdmin(order).catch((err) =>
    logger.error({ err, orderId: order._id }, "sendNewOrderAlertToAdmin failed"),
  );

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: { order },
  });
});

const getOrders = catchAsync(async (req, res) => {
  const { status, paymentStatus, fromDate, toDate, page = 1, limit = 20 } = req.query;

  const query = {};

  // Admin and moderator can see all orders, customers and workers see only their own
  if (["admin", "moderator"].includes(req.user.role)) {
    // No filter - show all orders
  } else {
    query.user = req.user._id;
  }

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const orders = await Order.find(query)
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: { orders },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "name email phone")
    .populate("items.product")
    .lean();

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  // Must be logged in
  if (!req.user) {
    throw ApiError.unauthorized("Please login to view this order");
  }

  // Get the user ID as a string (handle both populated and non-populated cases)
  const userId = req.user._id.toString();
  const orderUserId = order.user?._id?.toString() || order.user?.toString();

  // Guest orders (no user) visible only to admin/moderator; owned orders visible to owner
  if (!orderUserId && !["admin", "moderator"].includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to view this order");
  }
  if (orderUserId && userId !== orderUserId && !["admin", "moderator"].includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to view this order");
  }

  res.json({
    success: true,
    data: { order },
  });
});

const updateOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { shippingAddress } = req.body;

  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound("Order not found");

  if (order.user.toString() !== req.user._id.toString() && !["admin", "moderator"].includes(req.user.role)) {
    throw ApiError.forbidden("Not authorized");
  }

  if (shippingAddress) {
    const existing = order.shippingAddress ? order.shippingAddress.toObject() : {};
    order.shippingAddress = { ...existing, ...shippingAddress };
    if (!order.shippingAddress.fullName) order.shippingAddress.fullName = req.user.name;
    if (!order.shippingAddress.phone) order.shippingAddress.phone = req.user.phone;
  }

  await order.save();

  res.json({
    success: true,
    message: "Order updated",
    data: { order },
  });
});

const cancelOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString() && !["admin", "moderator"].includes(req.user.role)) {
    throw ApiError.forbidden("Not authorized to cancel this order");
  }

  if (["delivered", "cancelled", "refunded"].includes(order.status)) {
    throw ApiError.badRequest("Cannot cancel this order");
  }

  order.status = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    timestamp: new Date(),
    note: reason,
    updatedBy: req.user._id,
  });

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, totalSold: -item.quantity },
    });
  }

  await order.save();

  res.json({
    success: true,
    message: "Order cancelled successfully",
  });
});

const confirmOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  order.status = "confirmed";
  order.statusHistory.push({
    status: "confirmed",
    timestamp: new Date(),
    note: "Order confirmed",
    updatedBy: req.user._id,
  });

  await order.save();

  if (order.appliedCoupon?.code) {
    await Coupon.findOneAndUpdate({ code: order.appliedCoupon.code.toUpperCase() }, { $inc: { usedCount: 1 } });
  }

  res.json({
    success: true,
    message: "Order confirmed",
    data: { order },
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  confirmOrder,
};
