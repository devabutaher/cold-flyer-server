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
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  getWorkers,
  getWorker,
  deleteWorker,
  createWorkerWithUser,
  getApplications,
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

router.post("/coupons", authorize("admin", "moderator"), createCoupon);
router.get("/coupons", authorize("admin", "moderator"), getCoupons);
router.patch("/coupons/:id", authorize("admin", "moderator"), updateCoupon);
router.delete("/coupons/:id", authorize("admin", "moderator"), deleteCoupon);

router.get("/workers", authorize("admin", "moderator"), getWorkers);
router.get("/workers/:id", authorize("admin", "moderator"), getWorker);
router.delete("/workers/:id", authorize("admin"), deleteWorker);
router.post("/workers", authorize("admin", "moderator"), createWorkerWithUser);

router.get("/applications", authorize("admin", "moderator"), getApplications);
router.patch("/applications/:id/approve", authorize("admin", "moderator"), approveApplication);
router.patch("/applications/:id/reject", authorize("admin", "moderator"), rejectApplication);
router.delete("/applications/:id", authorize("admin"), deleteApplication);

// Reporting (admin-only)
router.get("/report", authorize("admin"), getReport);
router.get("/report/duplicates", authorize("admin"), getDuplicateCustomers);

module.exports = router;
