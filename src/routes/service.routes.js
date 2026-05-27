const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { serviceQuerySchema } = require("../validators/service.validator");
const {
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
} = require("../controllers/service.controller");

router.get("/featured", getFeaturedServices);
router.get("/", validate(serviceQuerySchema), getServices);
router.get("/slug/:slug", getServiceBySlug);

// Booking CRUD must be BEFORE /:id routes to avoid conflict
router.post("/bookings", createBooking);
router.get("/bookings", authenticate, getBookings);
router.get("/bookings/:id", authenticate, getBookingById);
router.patch("/bookings/:id", authenticate, authorize("admin", "moderator"), updateBooking);
router.patch("/bookings/:id/confirm", authenticate, authorize("admin", "moderator"), confirmBooking);
router.patch("/bookings/:id/schedule", authenticate, authorize("admin", "moderator"), scheduleBooking);
router.patch("/bookings/:id/start", authenticate, authorize("admin", "moderator", "worker"), startService);
router.patch("/bookings/:id/complete", authenticate, authorize("admin", "moderator", "worker"), completeBooking);
router.patch("/bookings/:id/cancel", authenticate, cancelBooking);

router.get("/:id", getServiceById);
router.post("/", authenticate, authorize("admin", "moderator"), createService);
router.patch("/:id", authenticate, authorize("admin", "moderator"), updateService);
router.delete("/:id", authenticate, authorize("admin", "moderator"), deleteService);

module.exports = router;
