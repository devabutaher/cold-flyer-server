const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { serviceSchema, serviceQuerySchema } = require('../validators/service.validator');
const {
  getServices, getServiceBySlug, getServiceById, getFeaturedServices, createService, updateService, deleteService,
  createBooking, getBookings, getBookingById, updateBooking, scheduleBooking, completeBooking, cancelBooking
} = require('../controllers/service.controller');

router.get('/featured', getFeaturedServices);
router.get('/', validate(serviceQuerySchema), getServices);
router.get('/slug/:slug', getServiceBySlug);
router.get('/:id', getServiceById);

router.post('/', authenticate, authorize('admin'), createService);
router.patch('/:id', authenticate, authorize('admin'), updateService);
router.delete('/:id', authenticate, authorize('admin'), deleteService);
router.patch('/bookings/:id/schedule', authenticate, authorize('admin'), scheduleBooking);
router.patch('/bookings/:id/complete', authenticate, authorize('admin'), completeBooking);
router.patch('/bookings/:id/cancel', authenticate, cancelBooking);

module.exports = router;