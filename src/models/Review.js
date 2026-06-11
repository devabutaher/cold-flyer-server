const mongoose = require("mongoose");

const helpfulSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

const reportedSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  reason: String,
  createdAt: { type: Date, default: Date.now },
});

const adminResponseSchema = new mongoose.Schema({
  comment: String,
  respondedBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBooking",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    title: String,
    comment: {
      type: String,
      required: [true, "Comment is required"],
    },
    photos: [String],
    videos: [String],
    pros: [String],
    cons: [String],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulBy: [helpfulSchema],
    reportedBy: [reportedSchema],
    adminResponse: adminResponseSchema,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending",
    },
    moderationNote: String,
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ service: 1 });
reviewSchema.index({ worker: 1 });

module.exports = mongoose.model("Review", reviewSchema);
