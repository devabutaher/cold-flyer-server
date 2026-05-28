const RecentWork = require("../models/RecentWork");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const getRecentWorks = catchAsync(async (req, res) => {
  const { category, featured, search, sortBy, page = 1, limit = 20 } = req.query;

  const query = {};

  if (category) query.category = { $regex: new RegExp(`^${category}$`, "i") };
  if (featured === "true") query.featured = true;
  if (search) query.$text = { $search: search };

  let sort = { createdAt: -1 };
  if (sortBy === "newest") sort = { createdAt: -1 };
  if (sortBy === "oldest") sort = { createdAt: 1 };
  if (sortBy === "views") sort = { views: -1 };
  if (sortBy === "title") sort = { title: 1 };

  const recentWorks = await RecentWork.find(query)
    .populate("author", "name avatar")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await RecentWork.countDocuments(query);

  res.json({
    success: true,
    message: "Recent works retrieved successfully",
    data: { recentWorks },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getRecentWorkBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const recentWork = await RecentWork.findOne({ slug }).populate("author", "name avatar");

  if (!recentWork) {
    throw ApiError.notFound("Recent work not found");
  }

  recentWork.views += 1;
  await recentWork.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: { recentWork },
  });
});

const getRecentWorkById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const recentWork = await RecentWork.findById(id).populate("author", "name avatar").lean();

  if (!recentWork) {
    throw ApiError.notFound("Recent work not found");
  }

  res.json({
    success: true,
    data: { recentWork },
  });
});

const getFeaturedRecentWorks = catchAsync(async (req, res) => {
  const { limit = 6 } = req.query;

  const recentWorks = await RecentWork.find({ featured: true })
    .populate("author", "name avatar")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    data: { recentWorks },
  });
});

const getRecentWorkCategories = catchAsync(async (req, res) => {
  const categories = await RecentWork.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: { categories: categories.map((c) => ({ name: c._id, count: c.count })) },
  });
});

const createRecentWork = catchAsync(async (req, res) => {
  const recentWork = await RecentWork.create({
    ...req.body,
    author: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Recent work created successfully",
    data: { recentWork },
  });
});

const updateRecentWork = catchAsync(async (req, res) => {
  const { id } = req.params;

  const recentWork = await RecentWork.findById(id);
  if (!recentWork) {
    throw ApiError.notFound("Recent work not found");
  }

  Object.assign(recentWork, req.body);
  await recentWork.save();

  res.json({
    success: true,
    message: "Recent work updated successfully",
    data: { recentWork },
  });
});

const deleteRecentWork = catchAsync(async (req, res) => {
  const { id } = req.params;

  const recentWork = await RecentWork.findByIdAndDelete(id);

  if (!recentWork) {
    throw ApiError.notFound("Recent work not found");
  }

  res.json({
    success: true,
    message: "Recent work deleted successfully",
  });
});

module.exports = {
  getRecentWorks,
  getRecentWorkBySlug,
  getRecentWorkById,
  getFeaturedRecentWorks,
  getRecentWorkCategories,
  createRecentWork,
  updateRecentWork,
  deleteRecentWork,
};
