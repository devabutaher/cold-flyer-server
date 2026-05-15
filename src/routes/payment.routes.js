const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function updateOrderPayment(orderId, paymentData) {
  if (!orderId) {
    const sessionId = paymentData?.id;
    const paymentIntentId = paymentData?.payment_intent;
    
    let order = null;
    if (sessionId) order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order && paymentIntentId) order = await Order.findOne({ paymentId: paymentIntentId });
    if (!order && sessionId) order = await Order.findOne({ paymentId: sessionId });
    
    if (order) orderId = order._id.toString();
  }
  
  if (!orderId) return;
  
  const order = await Order.findById(orderId);
  if (!order) return;
  
  if (order.paymentStatus === 'paid') return;
  
  order.paymentStatus = 'paid';
  if (order.status === 'pending') order.status = 'confirmed';
  order.paymentId = paymentData?.payment_intent || paymentData?.id;
  order.paidAt = new Date();
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status: 'paid', timestamp: new Date(), note: 'Payment completed via Stripe' });
  
  await order.save();
  logger.info({ orderNumber: order.orderNumber }, 'Order marked as paid');
}

const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let rawBody;
  if (req.body instanceof Buffer) {
    rawBody = req.body;
  } else if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (typeof req.body === 'object') {
    rawBody = JSON.stringify(req.body);
  } else {
    rawBody = String(req.body);
  }

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    logger.error({ err: err.message }, 'Webhook signature error');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await updateOrderPayment(event.data.object.metadata?.orderId, event.data.object);
  } catch (error) {
    logger.error({ err: error.message }, 'Webhook processing error');
    return res.status(500).json({ error: 'Failed to process webhook' });
  }

  res.json({ received: true });
};

router.post('/webhook', webhookHandler);

module.exports = router;
module.exports.webhookHandler = webhookHandler;