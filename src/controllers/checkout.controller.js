const logger = require('../utils/logger');
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  logger.warn({ err: e }, "Stripe not initialized");
}

const createCheckoutSession = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { provider } = req.body;

  if (provider === 'sslcommerz') {
    const sslcommerzController = require('./sslcommerz.controller');
    req.body.orderId = id;
    return sslcommerzController.initPayment(req, res);
  }

  if (provider === 'cod') {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("Order not found");
    if (!order.user || order.user.toString() !== req.user._id.toString()) throw ApiError.forbidden("Not authorized");
    if (order.paymentStatus === "paid") throw ApiError.badRequest("Order already paid");

    order.status = 'confirmed';
    order.paymentMethod = 'cod';
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Order placed with Cash on Delivery',
    });
    await order.save();

    return res.json({
      success: true,
      data: { orderId: order._id },
      message: 'Order placed successfully',
    });
  }

  const order = await Order.findById(id).populate("items.product");
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (!order.user || order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Not authorized");
  }

  if (order.paymentStatus === "paid") {
    throw ApiError.badRequest("Order already paid");
  }

  if (!stripe) {
    throw ApiError.badRequest("Payment system not available");
  }

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: "bdt",
      product_data: {
        name: item.name,
        description: item.sku,
        images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  if (order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "bdt",
        product_data: { name: "Shipping" },
        unit_amount: Math.round(order.shippingCost * 100),
      },
      quantity: 1,
    });
  }

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: "bdt",
        product_data: { name: "Tax" },
        unit_amount: Math.round(order.tax * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email: req.user.email,
    success_url: `${process.env.FRONTEND_URL}/order/${order._id}?success=true&provider=stripe`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard/orders`,
    metadata: {
      orderId: order._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  order.stripeSessionId = session.id;
  await order.save();

  res.json({
    success: true,
    data: {
      orderId: order._id,
      checkoutUrl: session.url,
      sessionId: session.id,
    },
  });
});

const verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { sessionId: frontendSessionId } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (!req.user) {
    throw ApiError.unauthorized("Please login to verify payment");
  }

  const userId = req.user._id.toString();
  const orderUserId = order.user?.toString();
  if (orderUserId && userId !== orderUserId && req.user.role !== "admin") {
    throw ApiError.forbidden("Not authorized");
  }

  if (order.paymentStatus === "paid") {
    return res.json({
      success: true,
      message: "Order already paid",
      data: { order },
    });
  }

  const sessionId = order.stripeSessionId || frontendSessionId;
  if (sessionId && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        throw ApiError.badRequest("Payment not confirmed by Stripe");
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.warn({ err: err.message }, "Stripe session verification failed, falling back to manual verify");
    }
  }

  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.paidAt = new Date();
  order.paymentId = sessionId || order.stripeSessionId;
  order.statusHistory.push({
    status: "paid",
    timestamp: new Date(),
    note: "Payment verified successfully",
  });

  await order.save();

  res.json({
    success: true,
    message: "Payment verified successfully",
    data: { order },
  });
});

module.exports = { createCheckoutSession, verifyPayment };
