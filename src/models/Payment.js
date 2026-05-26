const mongoose = require("mongoose");

const cardDetailsSchema = new mongoose.Schema({
  brand: String,
  last4: String,
  expMonth: Number,
  expYear: Number,
});

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBooking",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    method: {
      type: String,
      enum: ["card", "paypal", "bank_transfer", "wallet", "mobile_banking"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "sslcommerz", "paypal", "square"],
    },
    providerTransactionId: String,
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    cardDetails: cardDetailsSchema,
    refundAmount: Number,
    refundReason: String,
    metadata: mongoose.Schema.Types.Mixed,
    failureMessage: String,
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ user: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });

paymentSchema.pre("save", function (next) {
  if (!this.paymentId) {
    const random = Math.random().toString(36).substring(2, 15);
    this.paymentId = `PAY-${Date.now()}-${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
