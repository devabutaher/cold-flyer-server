const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { getTodayStatus, getAttendanceHistory, checkin, checkout } = require("../controllers/attendance.controller");

router.use(authenticate);

router.get("/today", authorize("admin", "worker"), getTodayStatus);
router.get("/history", authorize("admin", "worker"), getAttendanceHistory);
router.post("/checkin", authorize("admin", "worker"), checkin);
router.post("/checkout", authorize("admin", "worker"), checkout);

module.exports = router;
