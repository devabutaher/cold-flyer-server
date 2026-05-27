const User = require("../../models/User");
const Technician = require("../../models/Technician");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");

const getTechnicians = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const technicians = await Technician.find(query)
    .populate("user", "name email phone avatar")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Technician.countDocuments(query);

  res.json({
    success: true,
    data: { technicians },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const createTechnician = catchAsync(async (req, res) => {
  const { userId, employeeId, specializations, serviceAreas, vehicle, tools, hireDate, ...rest } = req.body;

  if (!userId) {
    throw ApiError.badRequest("userId is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.technicianProfile) {
    throw ApiError.conflict("User already has a technician profile");
  }

  const technician = await Technician.create({
    user: userId,
    employeeId,
    specializations: specializations || [],
    serviceAreas: serviceAreas || [],
    vehicle: vehicle || {},
    tools: tools || [],
    hireDate: hireDate || new Date(),
    ...rest,
  });

  user.technicianProfile = technician._id;
  await user.save();

  const populated = await Technician.findById(technician._id).populate("user", "name email phone avatar");

  res.status(201).json({
    success: true,
    message: "Technician profile created",
    data: { technician: populated },
  });
});

const getTechnician = catchAsync(async (req, res) => {
  const { id } = req.params;

  const technician = await Technician.findById(id).populate("user", "name email phone avatar");

  if (!technician) {
    throw ApiError.notFound("Technician not found");
  }

  res.json({ success: true, data: { technician } });
});

const updateTechnician = catchAsync(async (req, res) => {
  const { id } = req.params;

  const technician = await Technician.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate("user", "name email phone avatar");

  if (!technician) {
    throw ApiError.notFound("Technician not found");
  }

  res.json({ success: true, message: "Technician updated", data: { technician } });
});

const deleteTechnician = catchAsync(async (req, res) => {
  const { id } = req.params;

  const technician = await Technician.findById(id);
  if (!technician) {
    throw ApiError.notFound("Technician not found");
  }

  await User.findByIdAndUpdate(technician.user, { technicianProfile: null });
  await Technician.findByIdAndDelete(id);

  res.json({ success: true, message: "Technician profile removed" });
});

const createWorker = catchAsync(async (req, res) => {
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

  const technician = await Technician.create({
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

  user.technicianProfile = technician._id;
  await user.save();

  const populated = await Technician.findById(technician._id).populate("user", "name email phone avatar");

  res.status(201).json({
    success: true,
    message: "Worker created successfully",
    data: { technician: populated },
  });
});

module.exports = { getTechnicians, createTechnician, getTechnician, updateTechnician, deleteTechnician, createWorker };
