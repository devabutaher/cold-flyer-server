const User = require("../../models/User");
const Worker = require("../../models/Worker");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");

const getWorkers = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const workers = await Worker.find(query)
    .populate("user", "name email phone avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Worker.countDocuments(query);

  res.json({
    success: true,
    data: { workers },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const createWorker = catchAsync(async (req, res) => {
  const { userId, employeeId, specializations, serviceAreas, vehicle, tools, hireDate, ...rest } = req.body;

  if (!userId) {
    throw ApiError.badRequest("userId is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.workerProfile) {
    throw ApiError.conflict("User already has a worker profile");
  }

  const worker = await Worker.create({
    user: userId,
    employeeId,
    specializations: specializations || [],
    serviceAreas: serviceAreas || [],
    vehicle: vehicle || {},
    tools: tools || [],
    hireDate: hireDate || new Date(),
    ...rest,
  });

  user.workerProfile = worker._id;
  await user.save();

  const populated = await Worker.findById(worker._id).populate("user", "name email phone avatar");

  res.status(201).json({
    success: true,
    message: "Worker profile created",
    data: { worker: populated },
  });
});

const getWorker = catchAsync(async (req, res) => {
  const { id } = req.params;

  const worker = await Worker.findById(id).populate("user", "name email phone avatar");

  if (!worker) {
    throw ApiError.notFound("Worker not found");
  }

  res.json({ success: true, data: { worker } });
});

const updateWorker = catchAsync(async (req, res) => {
  const { id } = req.params;

  const worker = await Worker.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate("user", "name email phone avatar");

  if (!worker) {
    throw ApiError.notFound("Worker not found");
  }

  res.json({ success: true, message: "Worker updated", data: { worker } });
});

const deleteWorker = catchAsync(async (req, res) => {
  const { id } = req.params;

  const worker = await Worker.findById(id);
  if (!worker) {
    throw ApiError.notFound("Worker not found");
  }

  await User.findByIdAndUpdate(worker.user, { workerProfile: null });
  await Worker.findByIdAndDelete(id);

  res.json({ success: true, message: "Worker profile removed" });
});

const createWorkerWithUser = catchAsync(async (req, res) => {
  const { name, email, phone, password, specializations, salary } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest("Name, email, and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const user = await User.create({ name, email, phone, password, role: "worker" });

  const employeeId = `CF-${String(Math.floor(10000 + Math.random() * 90000)).slice(0, 5)}`;

  const worker = await Worker.create({
    user: user._id,
    employeeId,
    specializations: specializations
      ? Array.isArray(specializations)
        ? specializations
        : specializations
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
      : [],
    salary: salary || 0,
    hireDate: new Date(),
    status: "available",
    isActive: true,
  });

  user.workerProfile = worker._id;
  await user.save();

  const populated = await Worker.findById(worker._id).populate("user", "name email phone avatar");

  res.status(201).json({
    success: true,
    message: "Worker created successfully",
    data: { worker: populated },
  });
});

module.exports = { getWorkers, createWorker, getWorker, updateWorker, deleteWorker, createWorkerWithUser };
