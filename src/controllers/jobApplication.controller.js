const User = require("../models/User");
const Technician = require("../models/Technician");
const JobApplication = require("../models/JobApplication");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const {
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
  sendApplicationReceivedEmail,
} = require("../services/email.service");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const submitApplication = catchAsync(async (req, res) => {
  const { name, email, phone, position, experience, skills, coverLetter, resumeUrl } = req.body;

  if (!name || !email || !phone || !position) {
    throw ApiError.badRequest("Name, email, phone, and position are required");
  }

  const existing = await JobApplication.findOne({ email, status: { $in: ["pending", "approved"] } });
  if (existing) {
    throw ApiError.conflict("You already have a pending or approved application");
  }

  const application = await JobApplication.create({
    name,
    email,
    phone,
    position,
    experience: experience || "",
    skills: skills || [],
    coverLetter: coverLetter || "",
    resumeUrl: resumeUrl || null,
  });

  // Send acknowledgment email
  await sendApplicationReceivedEmail(application.email, application.name, application.position);

  res.status(201).json({
    success: true,
    message: "Application submitted successfully. We will review and get back to you.",
    data: { application },
  });
});

const getApplications = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query.status = status;
  }

  const applications = await JobApplication.find(query)
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await JobApplication.countDocuments(query);

  res.json({
    success: true,
    data: { applications },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getApplication = catchAsync(async (req, res) => {
  const { id } = req.params;

  const application = await JobApplication.findById(id).populate("reviewedBy", "name email");

  if (!application) {
    throw ApiError.notFound("Application not found");
  }

  res.json({ success: true, data: { application } });
});

const approveApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  const application = await JobApplication.findById(id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }

  if (application.status !== "pending") {
    throw ApiError.badRequest(`Application is already ${application.status}`);
  }

  // Find or create the user
  let user = await User.findOne({ email: application.email.toLowerCase() });

  if (!user) {
    // Generate a random password
    const tempPassword = crypto.randomBytes(12).toString("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    user = await User.create({
      name: application.name,
      email: application.email.toLowerCase(),
      phone: application.phone,
      password: hashedPassword,
      role: "worker",
      isEmailVerified: false,
    });
  } else {
    user.role = "worker";
    await user.save();
  }

  // Generate employeeId
  const employeeId = `CF-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;

  // Create technician profile
  const technician = await Technician.create({
    user: user._id,
    employeeId,
    specializations: application.skills || [],
    hireDate: new Date(),
    status: "available",
    isActive: true,
  });

  // Link technician profile to user
  user.technicianProfile = technician._id;
  await user.save();

  // Update application
  application.status = "approved";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  // Send approval email
  await sendApplicationApprovedEmail(application.email, application.name);

  const populated = await Technician.findById(technician._id).populate("user", "name email phone avatar");

  res.json({
    success: true,
    message: "Application approved. Technician profile created.",
    data: { application, technician: populated },
  });
});

const rejectApplication = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const adminId = req.user._id;

  const application = await JobApplication.findById(id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }

  if (application.status !== "pending") {
    throw ApiError.badRequest(`Application is already ${application.status}`);
  }

  application.status = "rejected";
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  application.notes = notes || "";
  await application.save();

  // Send rejection email
  await sendApplicationRejectedEmail(application.email, application.name, notes);

  res.json({
    success: true,
    message: "Application rejected.",
    data: { application },
  });
});

const deleteApplication = catchAsync(async (req, res) => {
  const { id } = req.params;

  const application = await JobApplication.findById(id);
  if (!application) {
    throw ApiError.notFound("Application not found");
  }

  if (application.status === "approved") {
    const user = await User.findOne({ email: application.email.toLowerCase() });
    if (user?.technicianProfile) {
      throw ApiError.badRequest("Cannot delete an approved application. Remove the technician profile first.");
    }
  }

  await JobApplication.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Application deleted.",
  });
});

module.exports = {
  submitApplication,
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  deleteApplication,
};
