const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { getReviews, moderateReview, deleteReview, markHelpful } = require("../controllers/review.controller");

router.get("/", getReviews);

router.patch("/:id/moderate", authenticate, authorize("admin"), moderateReview);
router.delete("/:id", authenticate, authorize("admin"), deleteReview);
router.post("/:id/helpful", authenticate, markHelpful);

module.exports = router;
