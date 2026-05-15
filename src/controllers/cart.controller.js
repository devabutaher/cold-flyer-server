const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name slug images price originalPrice stockStatus');

  if (!cart) {
    const newCart = await Cart.create({ user: req.user._id, items: [] });
    return res.json({ success: true, data: { cart: newCart } });
  }

  res.json({ success: true, data: { cart } });
});

const addItem = catchAsync(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw ApiError.notFound('Product not found or unavailable');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      image: product.images[0]?.url,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity,
      variant,
    });
  }

  await cart.save();

  await cart.populate('items.product', 'name slug images price originalPrice stockStatus');

  res.status(201).json({ success: true, message: 'Item added to cart', data: { cart } });
});

const updateItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  const item = cart.items.id(id);
  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product', 'name slug images price originalPrice stockStatus');

  res.json({ success: true, message: 'Cart updated', data: { cart } });
});

const removeItem = catchAsync(async (req, res) => {
  const { id } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  const item = cart.items.id(id);
  if (!item) {
    throw ApiError.notFound('Item not found in cart');
  }

  item.deleteOne();
  await cart.save();

  res.json({ success: true, message: 'Item removed from cart' });
});

const clearCart = catchAsync(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], subtotal: 0, itemCount: 0, coupon: null });

  res.json({ success: true, message: 'Cart cleared' });
});

const applyCoupon = catchAsync(async (req, res) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });

  if (!coupon) {
    throw ApiError.badRequest('Invalid or expired coupon');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  if (coupon.minOrderValue && cart.subtotal < coupon.minOrderValue) {
    throw ApiError.badRequest(`Minimum order value of $${coupon.minOrderValue} required`);
  }

  cart.coupon = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };

  await cart.save();

  res.json({ success: true, message: 'Coupon applied', data: { cart } });
});

const removeCoupon = catchAsync(async (req, res) => {
  const cart = await Cart.findOneAndUpdate({ user: req.user._id }, { coupon: null }, { new: true });

  res.json({ success: true, message: 'Coupon removed', data: { cart } });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon };