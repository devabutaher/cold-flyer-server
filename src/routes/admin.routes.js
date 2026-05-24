const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const {
  getDashboard,
  getAnalytics,
  getAllUsers,
  updateUserRole,
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
  getApplications,
  getApplication,
  approveApplication,
  rejectApplication,
} = require("../controllers/admin");

router.use(authenticate);
router.use(authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);

router.get("/users", getAllUsers);
router.patch("/users/:id", updateUserRole);

router.get("/products", getAllProducts);
router.get("/orders", getAllOrders);
router.get("/services", getAllServices);
router.get("/reviews", getAllReviews);

router.post("/coupons", createCoupon);
router.get("/coupons", getCoupons);
router.patch("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.patch("/coupons/:id/toggle", toggleCouponStatus);

router.get("/technicians", getTechnicians);
router.post("/technicians", createTechnician);
router.get("/technicians/:id", getTechnician);
router.patch("/technicians/:id", updateTechnician);
router.delete("/technicians/:id", deleteTechnician);

router.get("/applications", getApplications);
router.get("/applications/:id", getApplication);
router.patch("/applications/:id/approve", approveApplication);
router.patch("/applications/:id/reject", rejectApplication);

module.exports = router;
