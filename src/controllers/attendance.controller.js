const Attendance = require("../models/Attendance");
const Technician = require("../models/Technician");
const LocationLog = require("../models/LocationLog");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function nowTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

const getTodayStatus = catchAsync(async (req, res) => {
  // Workers see only their own status
  if (req.user.role === "worker") {
    const workerTech = await Technician.findById(req.user.technicianProfile);
    if (!workerTech) {
      return res.json({ success: true, data: { workers: [] } });
    }

    const today = todayStr();
    const record = await Attendance.findOne({ worker: req.user.technicianProfile, date: today });

    const result = [
      {
        _id: workerTech._id,
        workerName: req.user.name || "Unknown",
        phone: req.user.phone || "",
        status: workerTech.status,
        attendance: record
          ? {
              _id: record._id,
              inTime: record.inTime,
              outTime: record.outTime,
              location: record.location,
              task: record.task,
              note: record.note,
            }
          : null,
      },
    ];

    return res.json({ success: true, data: { workers: result } });
  }

  const workers = await Technician.find({ isActive: true })
    .populate("user", "name email phone avatar")
    .select("user status nid bloodGroup emergencyContact salary");

  const today = todayStr();
  const records = await Attendance.find({ date: today });

  const statusMap = {};
  records.forEach((r) => {
    statusMap[r.worker.toString()] = r;
  });

  const result = workers.map((w) => {
    const record = statusMap[w._id.toString()];
    return {
      _id: w._id,
      workerName: w.user?.name || "Unknown",
      phone: w.user?.phone || "",
      nid: w.nid,
      bloodGroup: w.bloodGroup,
      emergencyContact: w.emergencyContact,
      salary: w.salary,
      status: w.status,
      attendance: record
        ? {
            _id: record._id,
            inTime: record.inTime,
            outTime: record.outTime,
            location: record.location,
            task: record.task,
            note: record.note,
          }
        : null,
    };
  });

  res.json({ success: true, data: { workers: result } });
});

const getAttendanceHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 100, startDate, endDate, workerId } = req.query;

  const query = {};
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  // Workers can only see their own history
  if (req.user.role === "worker") {
    query.worker = req.user.technicianProfile;
  } else if (workerId) {
    query.worker = workerId;
  }

  const records = await Attendance.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments(query);

  res.json({
    success: true,
    data: { records },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const checkin = catchAsync(async (req, res) => {
  const { workerId, location, task, lat, lng } = req.body;
  if (!workerId) throw ApiError.badRequest("workerId is required");

  // Workers can only check in for themselves
  if (req.user.role === "worker" && req.user.technicianProfile?.toString() !== workerId) {
    throw ApiError.forbidden("You can only check in for yourself");
  }

  const technician = await Technician.findById(workerId).populate("user", "name");
  if (!technician) throw ApiError.notFound("Technician not found");

  const today = todayStr();
  const existing = await Attendance.findOne({ worker: workerId, date: today });
  if (existing) {
    throw ApiError.conflict("Already checked in today");
  }

  const inTime = nowTime();
  const workerName = technician.user?.name || "Unknown";

  const record = await Attendance.create({
    worker: workerId,
    workerName,
    date: today,
    inTime,
    location: location || "",
    task: task || "",
    lat: lat || undefined,
    lng: lng || undefined,
  });

  // Update technician status
  technician.status = "available";
  await technician.save();

  // Log location
  if (location || (lat && lng)) {
    await LocationLog.create({
      worker: workerId,
      workerName,
      date: today,
      time: inTime,
      address: location || "",
      lat: lat || undefined,
      lng: lng || undefined,
      task: task || "",
    });
  }

  res.status(201).json({ success: true, data: { attendance: record } });
});

const checkout = catchAsync(async (req, res) => {
  const { workerId, note } = req.body;
  if (!workerId) throw ApiError.badRequest("workerId is required");

  // Workers can only check out for themselves
  if (req.user.role === "worker" && req.user.technicianProfile?.toString() !== workerId) {
    throw ApiError.forbidden("You can only check out for yourself");
  }

  const today = todayStr();
  const record = await Attendance.findOne({ worker: workerId, date: today });
  if (!record) throw ApiError.notFound("No check-in record found for today");
  if (record.outTime) throw ApiError.conflict("Already checked out today");

  record.outTime = nowTime();
  if (note) record.note = note;
  await record.save();

  // Update technician status
  await Technician.findByIdAndUpdate(workerId, { status: "offline" });

  res.json({ success: true, data: { attendance: record } });
});

module.exports = { getTodayStatus, getAttendanceHistory, checkin, checkout };
