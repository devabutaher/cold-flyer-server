const express = require("express");
const router = express.Router();
const { submitApplication } = require("../controllers/jobApplication.controller");

// Public route — no auth
router.post("/", submitApplication);

module.exports = router;
