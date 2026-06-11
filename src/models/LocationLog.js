const mongoose = require("mongoose");

const locationLogSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    workerName: { type: String },
    date: { type: String },
    time: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    task: { type: String },
  },
  {
    timestamps: true,
  },
);

locationLogSchema.index({ date: -1 });
locationLogSchema.index({ worker: 1, date: -1 });

module.exports = mongoose.model("LocationLog", locationLogSchema);
