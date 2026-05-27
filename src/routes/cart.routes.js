const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  applyCoupon,
  removeCoupon,
} = require("../controllers/cart.controller");

router.patch("/apply-coupon", authenticate, applyCoupon);
router.delete("/remove-coupon", authenticate, removeCoupon);

module.exports = router;
