const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { getLocations } = require("../controllers/location.controller");

router.use(authenticate);
router.use(authorize("admin"));

router.get("/", getLocations);

module.exports = router;
