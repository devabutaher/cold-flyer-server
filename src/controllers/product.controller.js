const Product = require('../models/Product');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getProducts = catchAsync(async (req, res) => {
  const {
    category,
    brand,
    productType,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    onSale,
    featured,
    search,
    sortBy,
    page = 1,
    limit = 20,
  } = req.query;

  const query = { isActive: true };

  if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  if (brand) query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
  if (productType) query.productType = productType;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (minRating) query.rating = { $gte: Number(minRating) };
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (onSale === 'true') query.onSale = true;
  if (featured === 'true') query.featured = true;
  if (search) query.$text = { $search: search };

  let sort = { createdAt: -1 };
  if (sortBy === 'price_asc') sort = { price: 1 };
  if (sortBy === 'price_desc') sort = { price: -1 };
  if (sortBy === 'rating') sort = { rating: -1 };
  if (sortBy === 'popular') sort = { totalSold: -1 };
  if (sortBy === 'newest') sort = { createdAt: -1 };

  const products = await Product.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    message: 'Products retrieved successfully',
    data: { products },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getProductBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isActive: true });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  res.json({
    success: true,
    data: { product },
  });
});

const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id, isActive: true });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  res.json({
    success: true,
    data: { product },
  });
});

const getFeaturedProducts = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ featured: true, isActive: true })
    .sort({ rating: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { products },
  });
});

const getBestSellers = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ bestSeller: true, isActive: true })
    .sort({ totalSold: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { products },
  });
});

const getNewArrivals = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ newArrival: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { products },
  });
});

const getOnSale = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ onSale: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { products },
  });
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: { categories: categories.map((c) => ({ name: c._id, count: c.count })) },
  });
});

const createProduct = catchAsync(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product },
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to update this product');
  }

  Object.assign(product, req.body);
  product.updatedBy = req.user._id;
  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product },
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to delete this product');
  }

  product.isActive = false;
  await product.save();

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

const updateStock = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const product = await Product.findByIdAndUpdate(
    id,
    { stock, updatedBy: req.user._id },
    { new: true }
  );

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  res.json({
    success: true,
    message: 'Stock updated successfully',
    data: { product },
  });
});

const getProductReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.find({ product: id, status: 'approved' })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ product: id, status: 'approved' });

  const product = await Product.findById(id).select('rating reviewCount');

  res.json({
    success: true,
    data: { reviews, rating: product.rating, reviewCount: product.reviewCount },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const addReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment, photos } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    product: id,
  });

  if (existingReview) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  const review = await Review.create({
    user: req.user._id,
    product: id,
    rating,
    title,
    comment,
    photos,
    status: 'pending',
  });

  const reviews = await Review.find({ product: id, status: 'approved' });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await Product.findByIdAndUpdate(id, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: { review },
  });
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getOnSale,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductReviews,
  addReview,
};