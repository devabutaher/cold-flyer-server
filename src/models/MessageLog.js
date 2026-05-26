const mongoose = require("mongoose");

const messageLogSchema = new mongoose.Schema(
  {
    time: { type: String },
    name: { type: String },
    number: { type: String },
    channel: {
      type: String,
      enum: ["WhatsApp", "SMS"],
    },
    message: { type: String },
  },
  {
    timestamps: true,
  },
);

messageLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("MessageLog", messageLogSchema);
