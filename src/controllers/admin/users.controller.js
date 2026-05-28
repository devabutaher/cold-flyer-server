const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const { sendNewAdminAlertToSuperAdmin } = require("../../services/email.service");

const SUPER_ADMIN = process.env.ADMIN_EMAIL;

const getAllUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  const query = {};

  // Moderators can only see customers and workers
  if (req.user.role === "moderator") {
    query.role = { $in: ["customer", "worker"] };
  } else if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: { users },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).populate("technicianProfile").lean();

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // Moderators cannot view admin or moderator accounts
  if (req.user.role === "moderator" && ["admin", "moderator"].includes(user.role)) {
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

  // Moderators cannot assign admin or moderator roles
  if (req.user.role === "moderator" && ["admin", "moderator"].includes(role)) {
    throw ApiError.forbidden("Moderators cannot assign admin or moderator roles");
  }

  // Only SUPER_ADMIN can assign the admin role
  if (role === "admin" && req.user.email !== SUPER_ADMIN) {
    throw ApiError.forbidden("Only the super admin can assign the admin role");
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

  // Moderators cannot delete users
  if (req.user.role === "moderator") {
    throw ApiError.forbidden("Moderators cannot delete users");
  }

  const user = await User.findById(id).lean();
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

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  // Moderators cannot create admin or moderator users
  if (req.user.role === "moderator" && ["admin", "moderator"].includes(role)) {
    throw ApiError.forbidden("Moderators cannot create admin or moderator users");
  }

  // Only SUPER_ADMIN can create admin users
  if (role === "admin" && req.user.email !== SUPER_ADMIN) {
    throw ApiError.forbidden("Only the super admin can create admin users");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || "customer",
  });

  // Alert super admin when a new admin account is created
  if (role === "admin") {
    sendNewAdminAlertToSuperAdmin(user, req.user).catch((err) =>
      console.error("sendNewAdminAlertToSuperAdmin failed:", err),
    );
  }

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: { user },
  });
});

module.exports = { getAllUsers, getUser, updateUserRole, deleteUser, createUser };
