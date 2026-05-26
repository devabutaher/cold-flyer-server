const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: String },
    userUID: { type: String },
    action: { type: String, required: true },
    detail: { type: String },
    type: {
      type: String,
      enum: ["customer", "worker", "expense", "user", "login", "attendance", "general"],
      default: "general",
    },
    date: { type: String },
    time: { type: String },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ date: -1 });
activityLogSchema.index({ type: 1 });
activityLogSchema.index({ userUID: 1 });

// Auto-prune to max 500 entries after each save
activityLogSchema.post("save", async function () {
  const count = await mongoose.model("ActivityLog").countDocuments();
  if (count > 500) {
    const oldest = await mongoose.model("ActivityLog").findOne().sort({ createdAt: 1 }).select("_id");
    if (oldest) {
      await mongoose.model("ActivityLog").findByIdAndDelete(oldest._id);
    }
  }
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
