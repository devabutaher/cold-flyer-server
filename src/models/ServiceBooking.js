const mongoose = require("mongoose");

const serviceItemSchema = new mongoose.Schema({
  service: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  quantity: Number,
});

const partUsedSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  cost: Number,
});

const additionalChargeSchema = new mongoose.Schema({
  description: String,
  amount: Number,
});

const serviceBookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    acBrand: { type: String, trim: true },
    acModel: { type: String, trim: true },
    acTon: { type: String, trim: true },
    acGasType: { type: String, trim: true },
    acType: { type: String, trim: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician" },
    items: [serviceItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "scheduled", "in_progress", "completed", "cancelled", "rescheduled"],
      default: "pending",
    },
    scheduledDate: Date,
    scheduledTime: { start: String, end: String },
    completedAt: Date,
    propertyDetails: {
      propertyType: String,
      issues: [String],
    },
    serviceAddress: {
      fullName: String,
      phone: String,
      district: String,
      thana: String,
      address: String,
    },
    diagnosis: String,
    workDone: String,
    partsUsed: [partUsedSchema],
    additionalCharges: [additionalChargeSchema],
    afterPhotos: [String],
    customerRating: { type: Number, min: 1, max: 5 },
    customerReview: String,
    warrantyInfo: String,
    notes: String,
    internalNotes: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partial"],
      default: "pending",
    },
    source: {
      type: String,
      enum: ["website", "mobile_app", "phone", "admin"],
      default: "website",
    },
  },
  {
    timestamps: true,
  },
);

serviceBookingSchema.index({ user: 1 });
serviceBookingSchema.index({ status: 1 });
serviceBookingSchema.index({ scheduledDate: 1 });
serviceBookingSchema.index({ paymentStatus: 1 });
serviceBookingSchema.index({ technician: 1, createdAt: -1 });

serviceBookingSchema.pre("save", function (next) {
  if (!this.bookingNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, "0");
    this.bookingNumber = `SB-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model("ServiceBooking", serviceBookingSchema);
