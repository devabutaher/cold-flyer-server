const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { createOrderNotification } = require('../services/notification.service');

const createOrder = catchAsync(async (req, res) => {
  const { items: requestItems, shippingAddress, billingAddress, paymentMethod, isPickup, pickupShop, notes, couponCode } = req.body;

  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  
  const itemsToProcess = (requestItems && requestItems.length > 0) 
    ? requestItems 
    : (cart && cart.items && cart.items.length > 0) 
      ? cart.items 
      : [];

  if (!itemsToProcess || itemsToProcess.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of itemsToProcess) {
    let productId = item.product?._id || item.product || item.productId;
    
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
      shop: product.shop,
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
    paymentMethod: paymentMethod || 'card',
    isPickup: isPickup || false,
    pickupShop,
    notes,
    source: 'website',
  });

  if (cart && cart._id) {
    await Cart.findByIdAndUpdate(cart._id, { items: [], subtotal: 0, itemCount: 0 });
  }

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

  // Admin can see all orders, customers see only their orders
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    // No filter - show all orders
  } else if (req.user.role === 'user' || req.user.role === 'customer') {
    query.user = req.user._id;
  } else if (['manager', 'technician'].includes(req.user.role) && req.user.shop) {
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
    .populate('items.product');

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  console.log('[getOrderById] Order:', order._id, 'User:', order.user);
  console.log('[getOrderById] Req User:', req.user?._id, 'Role:', req.user?.role);

  // Must be logged in
  if (!req.user) {
    throw ApiError.unauthorized('Please login to view this order');
  }
  
  // Get the user ID as a string (handle both populated and non-populated cases)
  const userId = req.user._id.toString();
  const orderUserId = order.user?._id?.toString() || order.user?.toString();
  
  console.log('[getOrderById] Order userId:', orderUserId, 'Request userId:', userId);
  
  // Allow if: order has no user (guest order), OR user owns the order, OR user is admin
  if (orderUserId && userId !== orderUserId && req.user.role !== 'admin') {
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