const LocationLog = require('../models/LocationLog');
const Technician = require('../models/Technician');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nowTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

const getLocations = catchAsync(async (req, res) => {
  const today = todayStr();

  // Get all active technicians with their latest location
  const workers = await Technician.find({ isActive: true })
    .populate('user', 'name email phone')
    .select('user status currentLocation');

  // Get today's location log entries
  const todayLog = await LocationLog.find({ date: today })
    .sort({ createdAt: -1 });

  const workerLocations = workers.map((w) => {
    const latestLog = todayLog.find((l) => l.worker && l.worker.toString() === w._id.toString());
    return {
      _id: w._id,
      workerName: w.user?.name || 'Unknown',
      phone: w.user?.phone || '',
      status: w.status,
      currentLocation: w.currentLocation,
      latestLog: latestLog
        ? { time: latestLog.time, address: latestLog.address, lat: latestLog.lat, lng: latestLog.lng, task: latestLog.task }
        : null,
    };
  });

  res.json({ success: true, data: { workers: workerLocations, todayLog } });
});

const logLocation = catchAsync(async (req, res) => {
  const { workerId, address, lat, lng, task } = req.body;
  if (!workerId) throw ApiError.badRequest('workerId is required');

  const technician = await Technician.findById(workerId).populate('user', 'name');
  if (!technician) throw ApiError.notFound('Technician not found');

  const entry = await LocationLog.create({
    worker: workerId,
    workerName: technician.user?.name || 'Unknown',
    date: todayStr(),
    time: nowTime(),
    address: address || '',
    lat: lat || undefined,
    lng: lng || undefined,
    task: task || '',
  });

  // Update technician's current location
  if (lat && lng) {
    technician.currentLocation = { lat, lng, updatedAt: new Date() };
    await technician.save();
  }

  res.status(201).json({ success: true, data: { location: entry } });
});

module.exports = { getLocations, logLocation };
