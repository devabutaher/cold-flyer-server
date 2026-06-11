const LocationLog = require("../models/LocationLog");
const Worker = require("../models/Worker");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function nowTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

const getLocations = catchAsync(async (req, res) => {
  const today = todayStr();

  // Get all active workers with their latest location
  const workers = await Worker.find({ isActive: true })
    .populate("user", "name email phone")

    .lean();

  const logs = await LocationLog.find({ date: today }).sort({ createdAt: -1 }).lean();

  const latestMap = {};
  logs.forEach((log) => {
    if (!latestMap[log.worker.toString()]) {
      latestMap[log.worker.toString()] = log;
    }
  });

  const data = workers
    .filter((w) => w.user && latestMap[w._id.toString()])
    .map((w) => ({
      _id: w._id,
      workerName: w.user?.name || "Unknown",
      email: w.user?.email,
      phone: w.user?.phone,
      status: w.status,
      currentLocation: w.currentLocation,
      location: latestMap[w._id.toString()],
    }));

  res.json({ success: true, data: { workers: data } });
});

module.exports = { getLocations };
