const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { moderatorDashboard, workerDashboard, customerDashboard } = require("../controllers/dashboard.controller");

router.use(authenticate);

router.get("/moderator", authorize("moderator"), moderatorDashboard);
router.get("/worker", authorize("worker"), workerDashboard);
router.get("/customer", authorize("customer"), customerDashboard);

module.exports = router;
