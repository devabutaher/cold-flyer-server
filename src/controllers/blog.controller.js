const Blog = require("../models/Blog");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const getBlogs = catchAsync(async (req, res) => {
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

  const blogs = await Blog.find(query)
    .populate("author", "name avatar")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await Blog.countDocuments(query);

  res.json({
    success: true,
    message: "Blogs retrieved successfully",
    data: { blogs },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getBlogBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug }).populate("author", "name avatar");

  if (!blog) {
    throw ApiError.notFound("Blog not found");
  }

  blog.views += 1;
  await blog.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: { blog },
  });
});

const getBlogById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id).populate("author", "name avatar").lean();

  if (!blog) {
    throw ApiError.notFound("Blog not found");
  }

  res.json({
    success: true,
    data: { blog },
  });
});

const getFeaturedBlogs = catchAsync(async (req, res) => {
  const { limit = 6 } = req.query;

  const blogs = await Blog.find({ featured: true })
    .populate("author", "name avatar")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    data: { blogs },
  });
});

const getBlogCategories = catchAsync(async (req, res) => {
  const categories = await Blog.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: { categories: categories.map((c) => ({ name: c._id, count: c.count })) },
  });
});

const createBlog = catchAsync(async (req, res) => {
  const blog = await Blog.create({
    ...req.body,
    author: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    data: { blog },
  });
});

const updateBlog = catchAsync(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);
  if (!blog) {
    throw ApiError.notFound("Blog not found");
  }

  Object.assign(blog, req.body);
  await blog.save();

  res.json({
    success: true,
    message: "Blog updated successfully",
    data: { blog },
  });
});

const deleteBlog = catchAsync(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) {
    throw ApiError.notFound("Blog not found");
  }

  res.json({
    success: true,
    message: "Blog deleted successfully",
  });
});

module.exports = {
  getBlogs,
  getBlogBySlug,
  getBlogById,
  getFeaturedBlogs,
  getBlogCategories,
  createBlog,
  updateBlog,
  deleteBlog,
};
