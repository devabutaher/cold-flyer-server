const logger = require("../utils/logger");
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { createPaymentIntent, handleWebhook, getPaymentById } = require("../controllers/payment.controller");
const Order = require("../models/Order");
const { sendOrderConfirmationEmail } = require("../services/email.service");

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  logger.warn({ err: e }, "Stripe not initialized in payment routes");
}

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

  if (order.paymentStatus === "paid") return;

  order.paymentStatus = "paid";
  if (order.status === "pending") order.status = "confirmed";
  order.paymentId = paymentData?.payment_intent || paymentData?.id;
  order.paidAt = new Date();
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status: "paid", timestamp: new Date(), note: "Payment completed via Stripe" });

  await order.save();

  await order.populate("user");
  sendOrderConfirmationEmail(order.user?.email, order.user?.name, order).catch((err) =>
    logger.error({ err, orderNumber: order.orderNumber }, "sendOrderConfirmationEmail failed"),
  );

  logger.info({ orderNumber: order.orderNumber }, "Order marked as paid");
}

const webhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let rawBody;
  if (req.body instanceof Buffer) {
    rawBody = req.body;
  } else if (typeof req.body === "string") {
    rawBody = req.body;
  } else if (typeof req.body === "object") {
    rawBody = JSON.stringify(req.body);
  } else {
    rawBody = String(req.body);
  }

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    logger.error({ err: err.message }, "Webhook signature error");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== "checkout.session.completed") {
    return res.json({ received: true });
  }

  try {
    await updateOrderPayment(event.data.object.metadata?.orderId, event.data.object);
  } catch (error) {
    logger.error({ err: error.message }, "Webhook processing error");
    return res.status(500).json({ error: "Failed to process webhook" });
  }

  res.json({ received: true });
};

// Stripe PaymentIntent endpoints (authenticated)
router.post("/create-payment-intent", authenticate, createPaymentIntent);
router.get("/:id", authenticate, getPaymentById);

// Stripe webhook (raw body, no auth)
router.post("/webhook", webhookHandler);

module.exports = router;
module.exports.webhookHandler = webhookHandler;
