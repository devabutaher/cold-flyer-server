const logger = require('../utils/logger');
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const initPayment = catchAsync(async (req, res) => {
  const { orderId } = req.body;

  if (!store_id || !store_passwd) {
    throw ApiError.badRequest("SSLCOMMERZ not configured");
  }

  const order = await Order.findById(orderId).populate("items.product");
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (!order.user || order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Not authorized");
  }

  if (order.paymentStatus === "paid") {
    throw ApiError.badRequest("Order already paid");
  }

  const tranId = `CF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const data = {
    total_amount: order.total,
    currency: 'BDT',
    tran_id: tranId,
    success_url: `${BACKEND_URL}/api/payments/sslcommerz/return`,
    fail_url: `${BACKEND_URL}/api/payments/sslcommerz/return`,
    cancel_url: `${FRONTEND_URL}/order/${order._id}?success=false&provider=sslcommerz`,
    ipn_url: `${BACKEND_URL}/api/payments/sslcommerz/ipn`,
    shipping_method: order.isPickup ? 'NO' : 'Courier',
    product_name: order.items.map(i => i.name).join(', ').slice(0, 255),
    product_category: 'General',
    product_profile: 'general',
    cus_name: req.user.name || req.user.email.split('@')[0],
    cus_email: req.user.email,
    cus_add1: order.shippingAddress?.addressLine1 || 'N/A',
    cus_add2: order.shippingAddress?.addressLine2 || 'N/A',
    cus_city: order.shippingAddress?.city || 'Dhaka',
    cus_state: order.shippingAddress?.state || 'Dhaka',
    cus_postcode: order.shippingAddress?.postalCode || '1000',
    cus_country: order.shippingAddress?.country || 'Bangladesh',
    cus_phone: req.user.phone || order.shippingAddress?.phone || '01700000000',
    cus_fax: req.user.phone || '01700000000',
    ship_name: order.shippingAddress?.fullName || req.user.name,
    ship_add1: order.shippingAddress?.addressLine1 || 'N/A',
    ship_add2: order.shippingAddress?.addressLine2 || 'N/A',
    ship_city: order.shippingAddress?.city || 'Dhaka',
    ship_state: order.shippingAddress?.state || 'Dhaka',
    ship_postcode: order.shippingAddress?.postalCode || '1000',
    ship_country: order.shippingAddress?.country || 'Bangladesh',
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const apiResponse = await sslcz.init(data);

  if (apiResponse.status !== 'SUCCESS') {
    logger.error({ apiResponse }, "SSLCOMMERZ init failed");
    throw ApiError.badRequest("Failed to initialize payment with SSLCOMMERZ");
  }

  order.sslcommerzTranId = tranId;
  await order.save();

  res.json({
    success: true,
    data: {
      orderId: order._id,
      checkoutUrl: apiResponse.GatewayPageURL,
      tranId,
    },
  });
});

const handleIpn = catchAsync(async (req, res) => {
  const { tran_id, status, bank_tran_id, card_type } = req.body;

  logger.info({ tran_id, status }, "SSLCOMMERZ IPN received");

  const order = await Order.findOne({ sslcommerzTranId: tran_id });
  if (!order) {
    logger.error({ tran_id }, "Order not found for SSLCOMMERZ IPN");
    return res.status(200).json({ error: "Order not found" });
  }

  if (order.paymentStatus === 'paid') {
    return res.status(200).json({ message: "Already paid" });
  }

  if (status === 'VALID' || status === 'VALIDATED') {
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    let validation;
    try {
      validation = await sslcz.validate({ val_id: req.body.val_id });
    } catch (e) {
      logger.error({ err: e.message, tran_id }, "SSLCOMMERZ validation failed");
      return res.status(200).json({ error: "Validation failed" });
    }

    if (validation.status !== 'VALID' && validation.status !== 'VALIDATED') {
      logger.error({ validation, tran_id }, "SSLCOMMERZ validation status not valid");
      return res.status(200).json({ error: "Transaction not valid" });
    }

    order.paymentStatus = 'paid';
    if (order.status === 'pending') order.status = 'confirmed';
    order.paymentId = bank_tran_id;
    order.paidAt = new Date();
    order.statusHistory.push({
      status: 'paid',
      timestamp: new Date(),
      note: `Payment completed via SSLCOMMERZ (${card_type || 'N/A'})`,
    });

    await order.save();
    logger.info({ orderNumber: order.orderNumber }, "Order marked as paid via SSLCOMMERZ");
  } else if (status === 'FAILED') {
    order.paymentStatus = 'failed';
    order.statusHistory.push({
      status: 'failed',
      timestamp: new Date(),
      note: `SSLCOMMERZ payment failed`,
    });
    await order.save();
  }

  res.status(200).json({ received: true });
});

const handleReturn = catchAsync(async (req, res) => {
  const { tran_id, status } = req.body;

  if (!tran_id) {
    return res.redirect(`${FRONTEND_URL}/order/unknown?success=false&provider=sslcommerz`);
  }

  const order = await Order.findOne({ sslcommerzTranId: tran_id });

  if (order && (status === 'VALID' || status === 'VALIDATED')) {
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      if (order.status === 'pending') order.status = 'confirmed';
      order.paidAt = new Date();
      order.statusHistory.push({
        status: 'paid',
        timestamp: new Date(),
        note: 'Payment completed via SSLCOMMERZ',
      });
      await order.save();
    }
    res.redirect(`${FRONTEND_URL}/order/${order._id}?success=true&provider=sslcommerz`);
  } else if (order) {
    res.redirect(`${FRONTEND_URL}/order/${order._id}?success=${status === 'VALID' || status === 'VALIDATED'}&provider=sslcommerz`);
  } else {
    res.redirect(`${FRONTEND_URL}/order/unknown?success=false&provider=sslcommerz`);
  }
});

const queryOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (!order.user || order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Not authorized");
  }

  if (!order.sslcommerzTranId) {
    throw ApiError.badRequest("No SSLCOMMERZ transaction for this order");
  }

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const response = await sslcz.transactionQueryByTransactionId({
    tran_id: order.sslcommerzTranId,
  });

  res.json({
    success: true,
    data: response,
  });
});

const verifySslcommerzPayment = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!store_id || !store_passwd) {
    throw ApiError.badRequest("SSLCOMMERZ not configured");
  }

  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound("Order not found");

  if (!order.user || order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Not authorized");
  }

  if (order.paymentStatus === 'paid') {
    return res.json({
      success: true,
      message: "Order already paid",
      data: { order },
    });
  }

  if (!order.sslcommerzTranId) {
    throw ApiError.badRequest("No SSLCOMMERZ transaction for this order");
  }

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  let queryResponse;
  try {
    queryResponse = await sslcz.transactionQueryByTransactionId({
      tran_id: order.sslcommerzTranId,
    });
  } catch (e) {
    logger.error({ err: e.message, tran_id: order.sslcommerzTranId }, "SSLCOMMERZ query failed");
    throw ApiError.badRequest("Failed to query SSLCOMMERZ transaction");
  }

  logger.info({ queryResponse, tran_id: order.sslcommerzTranId }, "SSLCOMMERZ verify query response");

  const txStatus = queryResponse?.status;
  if (txStatus !== 'VALID' && txStatus !== 'VALIDATED') {
    return res.json({
      success: false,
      message: `SSLCOMMERZ transaction status: ${txStatus || 'UNKNOWN'}`,
      data: { status: txStatus || 'UNKNOWN', raw: queryResponse },
    });
  }

  order.paymentStatus = 'paid';
  if (order.status === 'pending') order.status = 'confirmed';
  order.paymentId = order.sslcommerzTranId;
  order.paidAt = new Date();
  order.statusHistory.push({
    status: 'paid',
    timestamp: new Date(),
    note: 'Payment verified via SSLCOMMERZ query',
  });

  await order.save();

  res.json({
    success: true,
    message: "Payment verified successfully",
    data: { order },
  });
});

module.exports = { initPayment, handleIpn, handleReturn, queryOrder, verifySslcommerzPayment };
