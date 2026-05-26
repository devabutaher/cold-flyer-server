const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  getFeaturedCoupon,
  lookupCoupon,
  getActiveCoupons,
  autoApplyCoupon,
} = require("../controllers/coupon.controller");

const couponLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many coupon lookups, please try again later" },
});

router.get("/featured", getFeaturedCoupon);
router.get("/", getActiveCoupons);
router.get("/lookup/:code", couponLookupLimiter, lookupCoupon);
router.post("/auto-apply", autoApplyCoupon);

module.exports = router;
