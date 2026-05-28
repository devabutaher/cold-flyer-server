const ActivityLog = require("../models/ActivityLog");
const catchAsync = require("../utils/catchAsync");

const getActivityLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 100, user, type, startDate, endDate } = req.query;

  const query = {};
  if (user) query.userUID = user;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const logs = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await ActivityLog.countDocuments(query);

  // Get distinct users for filter dropdown
  const users = await ActivityLog.distinct("user", { user: { $ne: null } });

  res.json({
    success: true,
    data: { logs, users },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

module.exports = { getActivityLogs };
