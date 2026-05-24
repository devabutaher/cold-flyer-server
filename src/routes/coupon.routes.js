const express = require('express');
const router = express.Router();
const { getFeaturedCoupon, lookupCoupon } = require('../controllers/coupon.controller');

router.get('/featured', getFeaturedCoupon);
router.get('/lookup/:code', lookupCoupon);

module.exports = router;
