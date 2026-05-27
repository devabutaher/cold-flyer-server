const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
} = require("../controllers/customer.controller");

router.use(authenticate);
router.use(authorize("admin", "moderator"));

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.post("/", createCustomer);
router.patch("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.patch("/:id/toggle", toggleCustomerStatus);

module.exports = router;
