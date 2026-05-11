const Order = require("../models/Order");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.warn("Stripe not initialized:", e.message);
}

const quickCheckout = catchAsync(async (req, res) => {
  const { items, paymentMethod, isPickup } = req.body;

  if (!items || items.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  if (!stripe) {
    throw ApiError.badRequest("Payment system not available");
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    let productId = item.product;

    if (!productId) {
      throw ApiError.badRequest(`Invalid product ID: ${item.name || item.productId}`);
    }

    const product = await Product.findById(productId);
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

  const shippingCost = isPickup ? 0 : 60;
  const tax = subtotal * 0.05;
  const total = subtotal + shippingCost + tax;

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const order = new Order({
    orderNumber,
    user: null,
    items: orderItems,
    itemCount: orderItems.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    shippingCost,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    paymentMethod: paymentMethod || "card",
    isPickup: isPickup || false,
    source: "website",
  });
  order.statusHistory = [{ status: "pending", timestamp: new Date(), note: "Quick checkout" }];

  await order.save();

  const lineItems = orderItems.map((item) => ({
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

  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "bdt",
        product_data: { name: "Shipping" },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });
  }

  if (tax > 0) {
    lineItems.push({
      price_data: {
        currency: "bdt",
        product_data: { name: "Tax (5%)" },
        unit_amount: Math.round(tax * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/order/${order._id}?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/cart`,
    metadata: {
      orderId: order._id.toString(),
    },
  });

  order.stripeSessionId = session.id;
  await order.save();

  res.json({
    success: true,
    checkoutUrl: session.url,
  });
});

const createCheckoutSession = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id).populate("items.product");
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  // Check if user owns the order
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
        product_data: { name: "Tax (8%)" },
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
    success_url: `${process.env.FRONTEND_URL}/order/${order._id}?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/dashboard/orders`,
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
});

const verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  // Must be logged in
  if (!req.user) {
    throw ApiError.unauthorized("Please login to verify payment");
  }

  // Must own the order or be admin
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

  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.paidAt = new Date();
  order.statusHistory.push({
    status: "paid",
    timestamp: new Date(),
    note: "Payment completed successfully",
  });

  await order.save();

  res.json({
    success: true,
    message: "Payment verified successfully",
    data: { order },
  });
});

module.exports = { createCheckoutSession, verifyPayment, quickCheckout };
