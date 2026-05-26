const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  initPayment,
  handleIpn,
  handleReturn,
  queryOrder,
  verifySslcommerzPayment,
} = require("../controllers/sslcommerz.controller");

router.post("/init", authenticate, initPayment);
router.post("/ipn", handleIpn);
router.post("/return", handleReturn);
router.get("/query/:id", authenticate, queryOrder);
router.post("/verify/:id", authenticate, verifySslcommerzPayment);

module.exports = router;
