const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { getLocations, logLocation } = require("../controllers/location.controller");

router.use(authenticate);
router.use(authorize("admin"));

router.get("/", getLocations);
router.post("/", logLocation);

module.exports = router;
