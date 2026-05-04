const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.warn('Stripe not initialized:', e.message);
}

const createCheckoutSession = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate('items.product');
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized');
  }

  if (order.paymentStatus === 'paid') {
    throw ApiError.badRequest('Order already paid');
  }

  if (!stripe) {
    throw ApiError.badRequest('Payment system not available');
  }

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'bdt',
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
        currency: 'bdt',
        product_data: {
          name: 'Shipping',
        },
        unit_amount: Math.round(order.shippingCost * 100),
      },
      quantity: 1,
    });
  }

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: 'bdt',
        product_data: {
          name: 'Tax (8%)',
        },
        unit_amount: Math.round(order.tax * 100),
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/order/${order._id}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        checkoutUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (stripeError) {
    console.error('Stripe error:', stripeError.message);
    // Return order without redirect - let frontend handle
    res.json({
      success: true,
      data: {
        orderId: order._id,
        checkoutUrl: null,
        message: 'Order created. Payment pending.',
      },
    });
  }
});

module.exports = { createCheckoutSession };