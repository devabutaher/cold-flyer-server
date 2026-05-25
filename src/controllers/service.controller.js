const Service = require('../models/Service');
const ServiceBooking = require('../models/ServiceBooking');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const { createServiceNotification } = require('../services/notification.service');
const { sendBookingConfirmationEmail } = require('../services/email.service');
const Technician = require('../models/Technician');

const getServices = catchAsync(async (req, res) => {
  const { search, category, serviceType, sortBy, page = 1, limit = 20 } = req.query;

  const query = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }
  if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
  if (serviceType) query.serviceType = { $regex: new RegExp(`^${serviceType}$`, 'i') };

  let sort = { createdAt: -1 };
  if (sortBy === 'price_asc') sort = { basePrice: 1 };
  if (sortBy === 'price_desc') sort = { basePrice: -1 };
  if (sortBy === 'rating') sort = { rating: -1 };
  if (sortBy === 'popular') sort = { bookingCount: -1 };

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
    throw ApiError.notFound('Service not found');
  }

  res.json({
    success: true,
    data: { service },
  });
});

const getServiceById = catchAsync(async (req, res) => {
  const { id } = req.params;
  logger.debug({ serviceId: id }, 'getServiceById');

  const service = await Service.findById(id);
  logger.debug({ serviceId: id, found: !!service }, 'getServiceById result');

  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  res.json({
    success: true,
    data: { service },
  });
});

const getFeaturedServices = catchAsync(async (req, res) => {
  const services = await Service.find({ isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: { services },
  });
});

const createService = catchAsync(async (req, res) => {
  const service = await Service.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: { service },
  });
});

const updateService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: { service },
  });
});

const createBooking = catchAsync(async (req, res) => {
  const { service, scheduledDate, scheduledTime, propertyDetails, serviceAddress, notes } = req.body;

  const serviceData = await Service.findById(service);
  if (!serviceData) {
    throw ApiError.notFound('Service not found');
  }

  const price = serviceData.basePrice || 0;
  const booking = await ServiceBooking.create({
    user: req.user._id,
    service,
    items: [{ service, name: serviceData.name, price, quantity: 1 }],
    subtotal: price,
    total: price,
    scheduledDate,
    scheduledTime,
    propertyDetails,
    serviceAddress,
    notes,
    source: 'website',
  });

  await Service.findByIdAndUpdate(service, { $inc: { bookingCount: 1 } });

  req.user.serviceBookings.push(booking._id);
  await req.user.save();

  sendBookingConfirmationEmail(req.user.email, req.user.name || req.user.email, booking, 'confirmed').catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking },
  });
});

const getBookings = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};

  if (req.user.role === 'user') {
    query.user = req.user._id;
  } else if (['admin'].includes(req.user.role)) {
    if (req.query.userId) query.user = req.query.userId;
  }

  if (status) query.status = status;

  const bookings = await ServiceBooking.find(query)
    .populate('user', 'name email phone')
    .populate('service', 'name category')
    .populate('technician', 'user')
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
    .populate('user', 'name email phone')
    .populate('service')
    .populate('technician', 'user specializations');

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden("Not authorized to view this booking");
  }

  res.json({
    success: true,
    data: { booking },
  });
});

const updateBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  res.json({
    success: true,
    message: 'Booking updated successfully',
    data: { booking },
  });
});

const scheduleBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { scheduledDate, scheduledTime, technician } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  booking.scheduledDate = scheduledDate;
  booking.scheduledTime = scheduledTime;
  if (technician) booking.technician = technician;
  booking.status = 'scheduled';
  await booking.save();

  await createServiceNotification(booking.user, booking, 'scheduled');

  const populatedBooking = await ServiceBooking.findById(booking._id).populate('user', 'name email').populate('service', 'name');
  if (populatedBooking?.user?.email) {
    sendBookingConfirmationEmail(populatedBooking.user.email, populatedBooking.user.name || populatedBooking.user.email, populatedBooking, 'scheduled').catch(() => {});
  }

  res.json({
    success: true,
    message: 'Booking scheduled successfully',
    data: { booking },
  });
});

const completeBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { diagnosis, workDone, partsUsed, additionalCharges, afterPhotos, warrantyInfo } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  booking.diagnosis = diagnosis;
  booking.workDone = workDone;
  booking.partsUsed = partsUsed || [];
  booking.additionalCharges = additionalCharges || [];
  booking.afterPhotos = afterPhotos || [];
  booking.warrantyInfo = warrantyInfo;
  booking.status = 'completed';
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

  const completedBooking = await ServiceBooking.findById(booking._id).populate('user', 'name email').populate('service', 'name');
  if (completedBooking?.user?.email) {
    sendBookingConfirmationEmail(completedBooking.user.email, completedBooking.user.name || completedBooking.user.email, completedBooking, 'completed').catch(() => {});
  }

  res.json({
    success: true,
    message: 'Booking completed successfully',
    data: { booking },
  });
});

const cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden("Not authorized to cancel this booking");
  }

  if (['completed', 'cancelled'].includes(booking.status)) {
    throw ApiError.badRequest('Cannot cancel this booking');
  }

  booking.status = 'cancelled';
  booking.internalNotes = reason;
  await booking.save();

  await createServiceNotification(booking.user, booking, 'cancelled');

  const cancelledBooking = await ServiceBooking.findById(booking._id).populate('user', 'name email').populate('service', 'name');
  if (cancelledBooking?.user?.email) {
    sendBookingConfirmationEmail(cancelledBooking.user.email, cancelledBooking.user.name || cancelledBooking.user.email, cancelledBooking, 'cancelled').catch(() => {});
  }

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
  });
});

const confirmBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.status !== 'pending') {
    throw ApiError.badRequest('Only pending bookings can be confirmed');
  }

  booking.status = 'confirmed';
  await booking.save();

  await createServiceNotification(booking.user, booking, 'confirmed');

  const populatedBooking = await ServiceBooking.findById(booking._id).populate('user', 'name email').populate('service', 'name');
  if (populatedBooking?.user?.email) {
    sendBookingConfirmationEmail(populatedBooking.user.email, populatedBooking.user.name || populatedBooking.user.email, populatedBooking, 'confirmed').catch(() => {});
  }

  res.json({
    success: true,
    message: 'Booking confirmed successfully',
    data: { booking },
  });
});

const startService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  if (booking.status !== 'scheduled') {
    throw ApiError.badRequest('Only scheduled bookings can be started');
  }

  booking.status = 'in_progress';
  await booking.save();

  res.json({
    success: true,
    message: 'Service started successfully',
    data: { booking },
  });
});

const deleteService = catchAsync(async (req, res) => {
  const { id } = req.params;

  const service = await Service.findByIdAndDelete(id);

  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  res.json({
    success: true,
    message: 'Service deleted successfully',
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