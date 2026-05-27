const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const {
  getDashboard,
  getAnalytics,
  getAllUsers,
  getUser,
  updateUserRole,
  deleteUser,
  createUser,
  getAllProducts,
  getAllOrders,
  getAllServices,
  getAllReviews,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getTechnicians,
  createTechnician,
  getTechnician,
  updateTechnician,
  deleteTechnician,
  createWorker,
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  deleteApplication,
} = require("../controllers/admin");
const { getReport, getDuplicateCustomers } = require("../controllers/report.controller");

router.use(authenticate);

// Admin-only routes
router.get("/dashboard", authorize("admin"), getDashboard);
router.get("/analytics", authorize("admin"), getAnalytics);

// Admin + Moderator routes
router.get("/users", authorize("admin", "moderator"), getAllUsers);
router.get("/users/:id", authorize("admin", "moderator"), getUser);
router.patch("/users/:id", authorize("admin", "moderator"), updateUserRole);
router.delete("/users/:id", authorize("admin"), deleteUser);
router.post("/users", authorize("admin", "moderator"), createUser);

router.get("/products", authorize("admin", "moderator"), getAllProducts);
router.get("/orders", authorize("admin", "moderator"), getAllOrders);
router.get("/services", authorize("admin", "moderator"), getAllServices);
router.get("/reviews", authorize("admin", "moderator"), getAllReviews);

router.post("/coupons", authorize("admin", "moderator"), createCoupon);
router.get("/coupons", authorize("admin", "moderator"), getCoupons);
router.patch("/coupons/:id", authorize("admin", "moderator"), updateCoupon);
router.delete("/coupons/:id", authorize("admin", "moderator"), deleteCoupon);
router.patch("/coupons/:id/toggle", authorize("admin", "moderator"), toggleCouponStatus);

router.get("/technicians", authorize("admin", "moderator"), getTechnicians);
router.post("/technicians", authorize("admin", "moderator"), createTechnician);
router.get("/technicians/:id", authorize("admin", "moderator"), getTechnician);
router.patch("/technicians/:id", authorize("admin", "moderator"), updateTechnician);
router.delete("/technicians/:id", authorize("admin"), deleteTechnician);
router.post("/workers", authorize("admin", "moderator"), createWorker);

router.get("/applications", authorize("admin", "moderator"), getApplications);
router.get("/applications/:id", authorize("admin", "moderator"), getApplication);
router.patch("/applications/:id/approve", authorize("admin", "moderator"), approveApplication);
router.patch("/applications/:id/reject", authorize("admin", "moderator"), rejectApplication);
router.delete("/applications/:id", authorize("admin"), deleteApplication);

// Reporting (admin-only)
router.get("/report", authorize("admin"), getReport);
router.get("/report/duplicates", authorize("admin"), getDuplicateCustomers);

module.exports = router;
