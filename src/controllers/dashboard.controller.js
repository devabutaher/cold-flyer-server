const catchAsync = require("../utils/catchAsync");
const { getModeratorStats, getWorkerStats, getCustomerStats } = require("../services/dashboard.service");

const moderatorDashboard = catchAsync(async (req, res) => {
  const data = await getModeratorStats();
  res.json({ success: true, data });
});

const workerDashboard = catchAsync(async (req, res) => {
  const data = await getWorkerStats(req.user._id);
  res.json({ success: true, data });
});

const customerDashboard = catchAsync(async (req, res) => {
  const data = await getCustomerStats(req.user._id);
  res.json({ success: true, data });
});

module.exports = { moderatorDashboard, workerDashboard, customerDashboard };
