const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const {
  getServices, getServiceBySlug, getFeaturedServices, createService, updateService,
  createBooking, getBookings, getBookingById, updateBooking, scheduleBooking, completeBooking, cancelBooking
} = require('../controllers/service.controller');

router.get('/', getServices);
router.get('/slug/:slug', getServiceBySlug);
router.get('/featured', getFeaturedServices);

router.post('/', authenticate, authorize('admin'), createService);
router.patch('/:id', authenticate, authorize('admin'), updateService);
router.patch('/bookings/:id/schedule', authenticate, authorize('admin'), scheduleBooking);
router.patch('/bookings/:id/complete', authenticate, authorize('admin'), completeBooking);
router.patch('/bookings/:id/cancel', authenticate, cancelBooking);

module.exports = router;