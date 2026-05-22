const Review = require('../models/Review');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const getReviews = catchAsync(async (req, res) => {
  const { product, service, technician, status, page = 1, limit = 20 } = req.query;

  const query = {};

  if (product) query.product = product;
  if (service) query.service = service;
  if (technician) query.technician = technician;
  if (status) query.status = status;
  else if (req.user?.role !== 'admin') query.status = 'approved';

  const reviews = await Review.find(query)
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    data: { reviews },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const moderateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, moderationNote, adminResponse } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  review.status = status;
  review.moderationNote = moderationNote;

  if (adminResponse) {
    review.adminResponse = {
      comment: adminResponse.comment,
      respondedBy: req.user._id,
      createdAt: new Date(),
    };
  }

  await review.save();

  res.json({
    success: true,
    message: 'Review moderated successfully',
    data: { review },
  });
});

const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  await review.deleteOne();

  if (review.product) {
    const reviews = await Review.find({ product: review.product, status: 'approved' });
    const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  }

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});

const markHelpful = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  const alreadyMarked = review.helpfulBy.some((h) => h.user.toString() === req.user._id.toString());

  if (alreadyMarked) {
    review.helpfulBy = review.helpfulBy.filter((h) => h.user.toString() !== req.user._id.toString());
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    review.helpfulBy.push({ user: req.user._id });
    review.helpfulCount += 1;
  }

  await review.save();

  res.json({
    success: true,
    message: alreadyMarked ? 'Removed helpful' : 'Marked as helpful',
  });
});

module.exports = {
  getReviews,
  moderateReview,
  deleteReview,
  markHelpful,
};