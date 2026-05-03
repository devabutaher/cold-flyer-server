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

router.post('/', authenticate, authorize('manager', 'admin'), createService);
router.patch('/:id', authenticate, authorize('manager', 'admin'), updateService);

router.get('/bookings', authenticate, getBookings);
router.get('/bookings/:id', authenticate, getBookingById);
router.post('/bookings', authenticate, createBooking);
router.patch('/bookings/:id', authenticate, updateBooking);
router.patch('/bookings/:id/schedule', authenticate, authorize('manager', 'admin'), scheduleBooking);
router.patch('/bookings/:id/complete', authenticate, authorize('manager', 'admin', 'technician'), completeBooking);
router.patch('/bookings/:id/cancel', authenticate, cancelBooking);

module.exports = router;