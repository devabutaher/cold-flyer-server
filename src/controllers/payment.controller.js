const Payment = require('../models/Payment');
const Order = require('../models/Order');
const ServiceBooking = require('../models/ServiceBooking');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { createPaymentNotification } = require('../services/notification.service');

const initiatePayment = catchAsync(async (req, res) => {
  const { orderId, bookingId, method, amount, provider = 'stripe' } = req.body;

  let order, booking, paymentableId, paymentableType;

  if (orderId) {
    order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    paymentableId = order._id;
    paymentableType = 'Order';
  } else if (bookingId) {
    booking = await ServiceBooking.findById(bookingId);
    if (!booking) throw ApiError.notFound('Booking not found');
    paymentableId = booking._id;
    paymentableType = 'ServiceBooking';
  } else {
    throw ApiError.badRequest('Order or booking ID is required');
  }

  const payment = await Payment.create({
    user: req.user._id,
    order: orderId || null,
    booking: bookingId || null,
    amount: order?.total || booking?.total || amount,
    method: method || 'card',
    provider,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Payment initiated',
    data: { payment, clientSecret: 'pi_mock_secret_key' },
  });
});

const handleWebhook = catchAsync(async (req, res) => {
  const { paymentId, status, transactionId } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  payment.status = status === 'succeeded' ? 'succeeded' : 'failed';
  payment.providerTransactionId = transactionId;
  await payment.save();

  if (payment.order) {
    const order = await Order.findById(payment.order);
    order.paymentStatus = payment.status === 'succeeded' ? 'paid' : 'failed';
    order.paymentId = payment._id;
    await order.save();
    await createPaymentNotification(order.user, order, order.paymentStatus);
  }

  if (payment.booking) {
    const booking = await ServiceBooking.findById(payment.booking);
    booking.paymentStatus = payment.status === 'succeeded' ? 'paid' : 'failed';
    booking.paymentId = payment._id;
    await booking.save();
  }

  res.json({ success: true, message: 'Webhook processed' });
});

const getPaymentById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate('user', 'name email')
    .populate('order')
    .populate('booking');

  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  if (payment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized');
  }

  res.json({ success: true, data: { payment } });
});

module.exports = { initiatePayment, handleWebhook, getPaymentById };