const Service = require("../models/Service");
const ServiceBooking = require("../models/ServiceBooking");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const logger = require("../utils/logger");
const { createServiceNotification } = require("../services/notification.service");
const { sendBookingConfirmationEmail, sendNewBookingAlertToAdmin } = require("../services/email.service");
const Technician = require("../models/Technician");
const Customer = require("../models/Customer");

const getServices = catchAsync(async (req, res) => {
  const { search, category, serviceType, sortBy, page = 1, limit = 20 } = req.query;

  const query = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ name: { $regex: escaped, $options: "i" } }, { description: { $regex: escaped, $options: "i" } }];
  }
  if (category) query.category = { $regex: new RegExp(`^${category}$`, "i") };
  if (serviceType) query.serviceType = { $regex: new RegExp(`^${serviceType}$`, "i") };

  let sort = { createdAt: -1 };
  if (sortBy === "price_asc") sort = { basePrice: 1 };
  if (sortBy === "price_desc") sort = { basePrice: -1 };
  if (sortBy === "rating") sort = { rating: -1 };
  if (sortBy === "popular") sort = { bookingCount: -1 };

  const services = await Service.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Service.countDocuments(query);

  res.json({
    success: true,
    data: { services },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getServiceBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;

  // Try to find by slug first
  let service = await Service.findOne({ slug });

  // If not found and looks like an ObjectId, try by ID
  if (!service && slug.match(/^[0-9a-f]{24}$/)) {
    service = await Service.findById(slug);
  }

  if (!service) {
    throw ApiError.notFound("Service not found");
  }

  res.json({
    success: true,
    data: { service },
  });
});

const getServiceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  logger.debug({ serviceId: id }, "getServiceById");

  const service = await Service.findById(id);
  logger.debug({ serviceId: id, found: !!service }, "getServiceById result");

  if (!service) {
    throw ApiError.notFound("Service not found");
  }

  res.json({
    success: true,
    data: { service },
  });
});

const getFeaturedServices = catchAsync(async (req, res) => {
  const services = await Service.find({ isFeatured: true }).sort({ createdAt: -1 }).limit(10);

  res.json({
    success: true,
    data: { services },
  });
});

const createService = catchAsync(async (req, res) => {
  const service = await Service.create(req.body);

  res.status(201).json({
    success: true,
    message: "Service created successfully",
    data: { service },
  });
});

const updateService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

  if (!service) {
    throw ApiError.notFound("Service not found");
  }

  res.json({
    success: true,
    message: "Service updated successfully",
    data: { service },
  });
});

const createBooking = catchAsync(async (req, res) => {
  const {
    service,
    scheduledDate,
    scheduledTime,
    propertyDetails,
    serviceAddress,
    notes,
    acBrand,
    acModel,
    acTon,
    acGasType,
    acType,
    customerName,
    customerPhone,
    customerEmail,
  } = req.body;

  const serviceData = await Service.findById(service);
  if (!serviceData) {
    throw ApiError.notFound("Service not found");
  }

  const price = serviceData.basePrice || 0;

  // Resolve customer identity — logged-in user or guest
  const resolvedName = customerName || req.user?.name || "Guest";
  const resolvedPhone = customerPhone || req.user?.phone || "";
  const resolvedEmail = customerEmail || req.user?.email || "";

  const bookingData = {
    service,
    items: [{ service, name: serviceData.name, price, quantity: 1 }],
    subtotal: price,
    total: price,
    scheduledDate,
    scheduledTime,
    propertyDetails,
    serviceAddress,
    notes,
    acBrand,
    acModel,
    acTon,
    acGasType,
    acType,
    customerName: resolvedName,
    customerPhone: resolvedPhone,
    customerEmail: resolvedEmail,
    source: "website",
  };

  if (req.user) {
    bookingData.user = req.user._id;
  }

  const booking = await ServiceBooking.create(bookingData);

  await Service.findByIdAndUpdate(service, { $inc: { bookingCount: 1 } });

  // Link booking to user if logged in
  if (req.user) {
    req.user.serviceBookings.push(booking._id);
    await req.user.save();
  }

  // Auto-create or update Customer record by phone or email
  const lookupCriteria = [];
  if (resolvedPhone) lookupCriteria.push({ phone: resolvedPhone });
  if (resolvedEmail) lookupCriteria.push({ email: resolvedEmail });

  if (lookupCriteria.length > 0) {
    const existingCustomer = await Customer.findOne({ $or: lookupCriteria });

    if (existingCustomer) {
      existingCustomer.brand = acBrand || existingCustomer.brand;
      existingCustomer.model = acModel || existingCustomer.model;
      existingCustomer.acTon = acTon || existingCustomer.acTon;
      existingCustomer.gasType = acGasType || existingCustomer.gasType;
      existingCustomer.service = serviceData.name;
      existingCustomer.bookingCount = (existingCustomer.bookingCount || 1) + 1;
      if (!existingCustomer.bookingIds) existingCustomer.bookingIds = [];
      existingCustomer.bookingIds.push(booking._id);
      await existingCustomer.save();
    } else {
      await Customer.create({
        name: resolvedName,
        phone: resolvedPhone,
        email: resolvedEmail || undefined,
        brand: acBrand,
        model: acModel,
        acTon,
        gasType: acGasType,
        service: serviceData.name,
        amount: price,
        source: "website",
        addedBy: resolvedName,
        addedDate: new Date().toISOString().split("T")[0],
        bookingCount: 1,
        bookingIds: [booking._id],
      });
    }
  }

  // Send confirmation email (logged-in user or guest with email)
  if (resolvedEmail) {
    sendBookingConfirmationEmail(resolvedEmail, resolvedName, booking, "confirmed").catch((err) =>
      logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail failed"),
    );
  }

  // Alert super admin
  const populatedBookingForAlert = await ServiceBooking.findById(booking._id)
    .populate("user", "name email phone")
    .populate("service", "name");
  sendNewBookingAlertToAdmin(populatedBookingForAlert || booking).catch((err) =>
    logger.error({ err, bookingId: booking._id }, "sendNewBookingAlertToAdmin failed"),
  );

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    data: { booking },
  });
});

const getBookings = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};

  if (req.user.role === "customer") {
    query.user = req.user._id;
  } else if (req.user.role === "worker") {
    query.technician = req.user.technicianProfile;
  } else if (["admin", "moderator"].includes(req.user.role)) {
    if (req.query.userId) query.user = req.query.userId;
  }

  if (status) query.status = status;

  const bookings = await ServiceBooking.find(query)
    .populate("user", "name email phone")
    .populate("service", "name category")
    .populate({ path: "technician", select: "employeeId specializations", populate: { path: "user", select: "name" } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ServiceBooking.countDocuments(query);

  res.json({
    success: true,
    data: { bookings },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const getBookingById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findById(id)
    .populate("user", "name email phone")
    .populate("service")
    .populate("technician", "user specializations");

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  const isAdminOrModerator = ["admin", "moderator"].includes(req.user.role);
  const isAssignedWorker =
    req.user.role === "worker" &&
    req.user.technicianProfile &&
    booking.technician?.toString() === req.user.technicianProfile.toString();

  const isOwner = booking.user && booking.user.toString() === req.user._id.toString();

  if (!isOwner && !isAdminOrModerator && !isAssignedWorker) {
    throw ApiError.forbidden("Not authorized to view this booking");
  }

  res.json({
    success: true,
    data: { booking },
  });
});

const ALLOWED_BOOKING_FIELDS = [
  "scheduledDate",
  "scheduledTime",
  "status",
  "technician",
  "notes",
  "internalNotes",
  "diagnosis",
  "workDone",
  "partsUsed",
  "additionalCharges",
  "afterPhotos",
  "customerRating",
  "customerReview",
  "warrantyInfo",
  "completedAt",
  "propertyDetails",
  "serviceAddress",
  "acBrand",
  "acModel",
  "acTon",
  "acGasType",
  "acType",
];

const updateBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  const updates = {};
  for (const key of ALLOWED_BOOKING_FIELDS) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const booking = await ServiceBooking.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  res.json({
    success: true,
    message: "Booking updated successfully",
    data: { booking },
  });
});

const scheduleBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { scheduledDate, scheduledTime, technician } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  booking.scheduledDate = scheduledDate;
  booking.scheduledTime = scheduledTime;
  if (technician) booking.technician = technician;
  booking.status = "scheduled";
  await booking.save();

  if (booking.user) {
    await createServiceNotification(booking.user, booking, "scheduled");
  }

  const populatedBooking = await ServiceBooking.findById(booking._id)
    .populate("user", "name email")
    .populate("service", "name");

  // Send to logged-in user
  if (populatedBooking?.user?.email) {
    sendBookingConfirmationEmail(
      populatedBooking.user.email,
      populatedBooking.user.name || populatedBooking.user.email,
      populatedBooking,
      "scheduled",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail failed"));
  }

  // Send to guest customer
  if (!populatedBooking?.user?.email && populatedBooking?.customerEmail) {
    sendBookingConfirmationEmail(
      populatedBooking.customerEmail,
      populatedBooking.customerName || "Valued Customer",
      populatedBooking,
      "scheduled",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail for guest failed"));
  }

  res.json({
    success: true,
    message: "Booking scheduled successfully",
    data: { booking },
  });
});

const completeBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { diagnosis, workDone, partsUsed, additionalCharges, afterPhotos, warrantyInfo } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  // Workers can only complete bookings assigned to them
  if (
    req.user.role === "worker" &&
    (!req.user.technicianProfile || booking.technician?.toString() !== req.user.technicianProfile.toString())
  ) {
    throw ApiError.forbidden("You can only complete services assigned to you");
  }

  booking.diagnosis = diagnosis;
  booking.workDone = workDone;
  booking.partsUsed = partsUsed || [];
  booking.additionalCharges = additionalCharges || [];
  booking.afterPhotos = afterPhotos || [];
  booking.warrantyInfo = warrantyInfo;
  booking.status = "completed";
  booking.completedAt = new Date();

  if (additionalCharges && additionalCharges.length > 0) {
    const additionalTotal = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    booking.total += additionalTotal;
  }

  await booking.save();

  if (booking.technician) {
    await Technician.findByIdAndUpdate(booking.technician, {
      $inc: { completedJobs: 1 },
    });
  }

  const completedBooking = await ServiceBooking.findById(booking._id)
    .populate("user", "name email")
    .populate("service", "name");
  if (completedBooking?.user?.email) {
    sendBookingConfirmationEmail(
      completedBooking.user.email,
      completedBooking.user.name || completedBooking.user.email,
      completedBooking,
      "completed",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail failed"));
  }
  // Send to guest customer
  if (!completedBooking?.user?.email && completedBooking?.customerEmail) {
    sendBookingConfirmationEmail(
      completedBooking.customerEmail,
      completedBooking.customerName || "Valued Customer",
      completedBooking,
      "completed",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail for guest failed"));
  }

  res.json({
    success: true,
    message: "Booking completed successfully",
    data: { booking },
  });
});

const cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  const canCancel =
    ["admin", "moderator"].includes(req.user.role) ||
    (booking.user && booking.user.toString() === req.user._id.toString());

  if (booking.user) {
    if (!canCancel) {
      throw ApiError.forbidden("Not authorized to cancel this booking");
    }
  } else if (!canCancel) {
    throw ApiError.forbidden("Not authorized to cancel this booking");
  }

  if (["completed", "cancelled"].includes(booking.status)) {
    throw ApiError.badRequest("Cannot cancel this booking");
  }

  booking.status = "cancelled";
  booking.internalNotes = reason;
  await booking.save();

  if (booking.user) {
    await createServiceNotification(booking.user, booking, "cancelled");
  }

  const cancelledBooking = await ServiceBooking.findById(booking._id)
    .populate("user", "name email")
    .populate("service", "name");
  if (cancelledBooking?.user?.email) {
    sendBookingConfirmationEmail(
      cancelledBooking.user.email,
      cancelledBooking.user.name || cancelledBooking.user.email,
      cancelledBooking,
      "cancelled",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail failed"));
  }
  // Send to guest customer
  if (!cancelledBooking?.user?.email && cancelledBooking?.customerEmail) {
    sendBookingConfirmationEmail(
      cancelledBooking.customerEmail,
      cancelledBooking.customerName || "Valued Customer",
      cancelledBooking,
      "cancelled",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail for guest failed"));
  }

  res.json({
    success: true,
    message: "Booking cancelled successfully",
  });
});

const confirmBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  if (booking.status !== "pending") {
    throw ApiError.badRequest("Only pending bookings can be confirmed");
  }

  booking.status = "confirmed";
  await booking.save();

  if (booking.user) {
    await createServiceNotification(booking.user, booking, "confirmed");
  }

  const populatedBooking = await ServiceBooking.findById(booking._id)
    .populate("user", "name email")
    .populate("service", "name");
  if (populatedBooking?.user?.email) {
    sendBookingConfirmationEmail(
      populatedBooking.user.email,
      populatedBooking.user.name || populatedBooking.user.email,
      populatedBooking,
      "confirmed",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail failed"));
  }
  // Send to guest customer
  if (!populatedBooking?.user?.email && populatedBooking?.customerEmail) {
    sendBookingConfirmationEmail(
      populatedBooking.customerEmail,
      populatedBooking.customerName || "Valued Customer",
      populatedBooking,
      "confirmed",
    ).catch((err) => logger.error({ err, bookingId: booking._id }, "sendBookingConfirmationEmail for guest failed"));
  }

  res.json({
    success: true,
    message: "Booking confirmed successfully",
    data: { booking },
  });
});

const startService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound("Booking not found");
  }

  // Workers can only start bookings assigned to them
  if (
    req.user.role === "worker" &&
    (!req.user.technicianProfile || booking.technician?.toString() !== req.user.technicianProfile.toString())
  ) {
    throw ApiError.forbidden("You can only start services assigned to you");
  }

  if (booking.status !== "scheduled") {
    throw ApiError.badRequest("Only scheduled bookings can be started");
  }

  booking.status = "in_progress";
  await booking.save();

  res.json({
    success: true,
    message: "Service started successfully",
    data: { booking },
  });
});

const deleteService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findByIdAndDelete(id);

  if (!service) {
    throw ApiError.notFound("Service not found");
  }

  res.json({
    success: true,
    message: "Service deleted successfully",
  });
});

module.exports = {
  getServices,
  getServiceBySlug,
  getServiceById,
  getFeaturedServices,
  createService,
  updateService,
  deleteService,
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  confirmBooking,
  scheduleBooking,
  startService,
  completeBooking,
  cancelBooking,
};
