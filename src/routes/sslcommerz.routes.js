const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  handleIpn,
  handleReturn,
  verifySslcommerzPayment,
} = require("../controllers/sslcommerz.controller");

router.post("/ipn", handleIpn);
router.post("/return", handleReturn);
router.post("/verify/:id", authenticate, verifySslcommerzPayment);

module.exports = router;
