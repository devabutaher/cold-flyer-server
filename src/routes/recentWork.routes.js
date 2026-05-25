const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { recentWorkSchema, recentWorkQuerySchema } = require("../validators/recentWork.validator");
const {
  getRecentWorks,
  getRecentWorkBySlug,
  getRecentWorkById,
  getFeaturedRecentWorks,
  getRecentWorkCategories,
  createRecentWork,
  updateRecentWork,
  deleteRecentWork,
} = require("../controllers/recentWork.controller");

// Public routes
router.get("/featured", getFeaturedRecentWorks);
router.get("/categories", getRecentWorkCategories);
router.get("/slug/:slug", getRecentWorkBySlug);
router.get("/", validate(recentWorkQuerySchema), getRecentWorks);
router.get("/:id", getRecentWorkById);

// Admin routes
router.post("/", authenticate, authorize("admin"), validate(recentWorkSchema), createRecentWork);
router.patch("/:id", authenticate, authorize("admin"), updateRecentWork);
router.delete("/:id", authenticate, authorize("admin"), deleteRecentWork);

module.exports = router;
