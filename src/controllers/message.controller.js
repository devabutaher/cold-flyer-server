const MessageLog = require("../models/MessageLog");
const catchAsync = require("../utils/catchAsync");

const getMessages = catchAsync(async (req, res) => {
  const { page = 1, limit = 100, channel } = req.query;

  const query = {};
  if (channel) query.channel = channel;

  const messages = await MessageLog.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  const total = await MessageLog.countDocuments(query);

  res.json({
    success: true,
    data: { messages },
    meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
  });
});

const logMessage = catchAsync(async (req, res) => {
  const { time, name, number, channel, message } = req.body;

  const log = await MessageLog.create({
    time: time || new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    name: name || "",
    number: number || "",
    channel: channel || "WhatsApp",
    message: message || "",
  });

  res.status(201).json({ success: true, data: { message: log } });
});

module.exports = { getMessages, logMessage };
