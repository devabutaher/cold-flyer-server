const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { createOrderNotification } = require('../services/notification.service');

const createOrder = catchAsync(async (req, res) => {
  const { items, shippingAddress, billingAddress, paymentMethod, isPickup, pickupShop, notes, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.product._id);

    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Product ${item.name} is no longer available`);
    }

    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${item.name}`);
    }

    const itemTotal = product.price * item.quantity;
    orderItems.push({
      product: product._id,
      shop: product.shop,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.url,
      price: product.price,
      quantity: item.quantity,
      total: itemTotal,
    });

    subtotal += itemTotal;

    product.stock -= item.quantity;
    product.totalSold += item.quantity;
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

    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
      }

      coupon.usedCount += 1;
      await coupon.save();

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      };
    }
  }

  const shippingCost = isPickup ? 0 : (subtotal > 100 ? 0 : 10);
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shippingCost + tax;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    itemCount: cart.itemCount,
    subtotal,
    discount,
    couponDiscount: discount,
    appliedCoupon,
    shippingCost,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    shippingAddress,
    billingAddress,
    paymentMethod: paymentMethod || 'card',
    isPickup: isPickup || false,
    pickupShop,
    notes,
    source: 'website',
  });

  await Cart.findByIdAndUpdate(cart._id, { items: [], subtotal: 0, itemCount: 0 });

  req.user.orders.push(order._id);
  await req.user.save();

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
});

const getOrders = catchAsync(async (req, res) => {
  const { status, paymentStatus, fromDate, toDate, page = 1, limit = 20 } = req.query;

  let query = {};

  if (req.user.role === 'customer') {
    query.user = req.user._id;
  } else if (['manager', 'admin'].includes(req.user.role) && req.user.shop) {
    query.items = { $elemMatch: { shop: req.user.shop } };
  }

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = new Date(fromDate);
    if (toDate) query.createdAt.$lte = new Date(toDate);
  }

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
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

const getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate('items.product')
    .populate('paymentId');

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (req.user.role === 'customer' && order.user._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to view this order');
  }

  res.json({
    success: true,
    data: { order },
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  order.status = status;
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy: req.user._id,
  });

  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }

  await order.save();

  await createOrderNotification(order.user, order, status);

  res.json({
    success: true,
    message: 'Order status updated',
    data: { order },
  });
});

const cancelOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
    throw ApiError.badRequest('Cannot cancel this order');
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
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
    message: 'Order cancelled successfully',
  });
});

const confirmOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  order.status = 'confirmed';
  order.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date(),
    note: 'Order confirmed',
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Order confirmed',
    data: { order },
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  confirmOrder,
};