const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          order.paymentId = session.payment_intent;
          order.paidAt = new Date();
          order.statusHistory.push({
            status: 'paid',
            timestamp: new Date(),
            note: `Payment completed via Stripe. Session: ${session.id}`,
          });
          
          await order.save();
          console.log(`Order ${order.orderNumber} marked as paid`);
        }
      }
    } catch (error) {
      console.error('Error updating order payment status:', error);
      return res.status(500).json({ error: 'Failed to update order' });
    }
  }

  res.json({ received: true });
};

router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;