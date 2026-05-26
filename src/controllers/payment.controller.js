const logger = require('../utils/logger');
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const ServiceBooking = require("../models/ServiceBooking");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { createPaymentNotification } = require("../services/notification.service");

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  logger.warn({ err: e }, "Stripe not initialized in payments");
}

const createPaymentIntent = catchAsync(async (req, res) => {
  const { orderId, bookingId } = req.body;

  if (!stripe) {
    throw ApiError.badRequest("Payment system not available");
  }

  let entity, amount, entityType;

  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");
    if (order.paymentStatus === "paid") throw ApiError.badRequest("Order already paid");
    entity = order;
    amount = order.total;
    entityType = "order";
  } else if (bookingId) {
    const booking = await ServiceBooking.findById(bookingId);
    if (!booking) throw ApiError.notFound("Booking not found");
    if (booking.paymentStatus === "paid") throw ApiError.badRequest("Booking already paid");
    entity = booking;
    amount = booking.total;
    entityType = "booking";
  } else {
    throw ApiError.badRequest("Order or booking ID is required");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "bdt",
    metadata: {
      orderId: orderId || "",
      bookingId: bookingId || "",
      userId: req.user._id.toString(),
      entityType,
    },
  });

  const payment = await Payment.create({
    user: req.user._id,
    order: orderId || null,
    booking: bookingId || null,
    amount,
    method: "card",
    provider: "stripe",
    status: "pending",
    providerTransactionId: paymentIntent.id,
  });

  if (entityType === "order") {
    entity.stripeSessionId = paymentIntent.id;
    await entity.save();
  }

  res.status(201).json({
    success: true,
    message: "Payment intent created",
    data: { payment, clientSecret: paymentIntent.client_secret },
  });
});

const handleWebhook = catchAsync(async (req, res) => {
  const { paymentId, status, transactionId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw ApiError.notFound("Payment not found");
  }

  payment.status = status === "succeeded" ? "succeeded" : "failed";
  payment.providerTransactionId = transactionId;
  await payment.save();

  if (payment.order) {
    const order = await Order.findById(payment.order);
    order.paymentStatus = payment.status === "succeeded" ? "paid" : "failed";
    order.paymentId = payment._id;
    await order.save();
    await createPaymentNotification(order.user, order, order.paymentStatus);
  }

  if (payment.booking) {
    const booking = await ServiceBooking.findById(payment.booking);
    booking.paymentStatus = payment.status === "succeeded" ? "paid" : "failed";
    booking.paymentId = payment._id;
    await booking.save();
  }

  res.json({ success: true, message: "Webhook processed" });
});

const getPaymentById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id).populate("user", "name email").populate("order").populate("booking");

  if (!payment) {
    throw ApiError.notFound("Payment not found");
  }

  if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw ApiError.forbidden("Not authorized");
  }

  res.json({ success: true, data: { payment } });
});

module.exports = { createPaymentIntent, handleWebhook, getPaymentById };
