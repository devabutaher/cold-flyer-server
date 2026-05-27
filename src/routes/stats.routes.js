const router = require("express").Router();
const { getPublicStats } = require("../controllers/stats.controller");

router.get("/", getPublicStats);

module.exports = router;
