const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");

const getAllUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: { users },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).populate("technicianProfile");

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.json({ success: true, data: { user } });
});

const updateUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (req.user._id.toString() === id) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  res.json({ success: true, message: "User role updated", data: { user } });
});

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    throw ApiError.badRequest("You cannot delete your own account");
  }

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.technicianProfile) {
    throw ApiError.badRequest("Remove the technician profile first before deleting this user.");
  }

  await User.findByIdAndDelete(id);

  res.json({ success: true, message: "User deleted." });
});

const createUser = catchAsync(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest("Name, email, and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const user = await User.create({ name, email, phone, password, role: role || "user" });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: { user },
  });
});

module.exports = { getAllUsers, getUser, updateUserRole, deleteUser, createUser };
