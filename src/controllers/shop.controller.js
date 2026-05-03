const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getShops = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const shops = await Shop.find({ isActive: true })
    .populate('owner', 'name email')
    .sort({ rating: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Shop.countDocuments({ isActive: true });

  res.json({
    success: true,
    data: { shops },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getShopBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const shop = await Shop.findOne({ slug, isActive: true })
    .populate('owner', 'name email avatar')
    .populate('managers.user', 'name email avatar');

  if (!shop) {
    throw ApiError.notFound('Shop not found');
  }

  res.json({
    success: true,
    data: { shop },
  });
});

const getShopProducts = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { category, brand, sortBy, page = 1, limit = 20 } = req.query;

  const shop = await Shop.findOne({ slug, isActive: true });
  if (!shop) {
    throw ApiError.notFound('Shop not found');
  }

  const query = { shop: shop._id, isActive: true };

  if (category) query.category = category;
  if (brand) query.brand = brand;

  let sort = { createdAt: -1 };
  if (sortBy === 'price_asc') sort = { price: 1 };
  if (sortBy === 'price_desc') sort = { price: -1 };
  if (sortBy === 'rating') sort = { rating: -1 };

  const products = await Product.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    data: { products },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getShopServices = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const shop = await Shop.findOne({ slug, isActive: true });
  if (!shop) {
    throw ApiError.notFound('Shop not found');
  }

  const services = await Service.find({ shop: shop._id, isActive: true })
    .sort({ rating: -1 });

  res.json({
    success: true,
    data: { services },
  });
});

const getShopReviews = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const shop = await Shop.findOne({ slug, isActive: true });
  if (!shop) {
    throw ApiError.notFound('Shop not found');
  }

  const products = await Product.find({ shop: shop._id }).select('_id');
  const productIds = products.map((p) => p._id);

  const reviews = await import('../models/Review').then(({ default: Review }) =>
    Review.find({
      product: { $in: productIds },
      status: 'approved',
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
  );

  const total = await import('../models/Review').then(({ default: Review }) =>
    Review.countDocuments({ product: { $in: productIds }, status: 'approved' })
  );

  res.json({
    success: true,
    data: { reviews },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const createShop = catchAsync(async (req, res) => {
  const shop = await Shop.create({
    ...req.body,
    owner: req.user._id,
  });

  req.user.shop = shop._id;
  req.user.role = 'manager';
  await req.user.save();

  res.status(201).json({
    success: true,
    message: 'Shop created successfully',
    data: { shop },
  });
});

const updateShop = catchAsync(async (req, res) => {
  const { id } = req.params;

  const shop = await Shop.findById(id);
  if (!shop) {
    throw ApiError.notFound('Shop not found');
  }

  if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only update your own shop');
  }

  Object.assign(shop, req.body);
  await shop.save();

  res.json({
    success: true,
    message: 'Shop updated successfully',
    data: { shop },
  });
});

module.exports = {
  getShops,
  getShopBySlug,
  getShopProducts,
  getShopServices,
  getShopReviews,
  createShop,
  updateShop,
};