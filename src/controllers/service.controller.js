const Service = require('../models/Service');
const ServiceBooking = require('../models/ServiceBooking');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { createServiceNotification } = require('../services/notification.service');

const getServices = catchAsync(async (req, res) => {
  const { category, serviceType, page = 1, limit = 20 } = req.query;

  const query = {};

  if (category) query.category = category;
  if (serviceType) query.serviceType = serviceType;

  const services = await Service.find(query)
    .sort({ createdAt: -1 })
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

  const service = await Service.findOne({ slug });

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

  const booking = await ServiceBooking.create({
    user: req.user._id,
    service,
    items: [{ service, name: serviceData.name, price: serviceData.basePrice, quantity: 1 }],
    subtotal: serviceData.basePrice,
    total: serviceData.basePrice,
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

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking },
  });
});

const getBookings = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  let query = {};

  if (req.user.role === 'customer') {
    query.user = req.user._id;
  } else if (req.user.role === 'technician') {
    query.technician = req.user.technicianProfile;
  } else if (['manager', 'admin'].includes(req.user.role) && req.user.shop) {
    query.shop = req.user.shop;
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
  const { scheduledDate, scheduledTime } = req.body;

  const booking = await ServiceBooking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  booking.scheduledDate = scheduledDate;
  booking.scheduledTime = scheduledTime;
  booking.status = 'scheduled';
  await booking.save();

  await createServiceNotification(booking.user, booking, 'scheduled');

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
    await import('../models/Technician').then(({ default: Technician }) => {
      return Technician.findByIdAndUpdate(booking.technician, {
        $inc: { completedJobs: 1 },
      });
    });
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

  if (['completed', 'cancelled'].includes(booking.status)) {
    throw ApiError.badRequest('Cannot cancel this booking');
  }

  booking.status = 'cancelled';
  booking.internalNotes = reason;
  await booking.save();

  await createServiceNotification(booking.user, booking, 'cancelled');

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
  });
});

module.exports = {
  getServices,
  getServiceBySlug,
  getFeaturedServices,
  createService,
  updateService,
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  scheduleBooking,
  completeBooking,
  cancelBooking,
};