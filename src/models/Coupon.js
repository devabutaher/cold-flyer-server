const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    description: String,
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscount: Number,
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxUsage: Number,
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    applicableTo: {
      type: String,
      enum: ["all", "products", "categories", "brands", "services"],
      default: "all",
    },
    productIds: [mongoose.Schema.Types.ObjectId],
    serviceIds: [mongoose.Schema.Types.ObjectId],
    categoryIds: [String],
    brandIds: [String],
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    minItemCount: {
      type: Number,
      default: 0,
    },
    showOnBanner: {
      type: Boolean,
      default: true,
    },
    excludedProductIds: [mongoose.Schema.Types.ObjectId],
    excludedCategoryIds: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ isActive: 1 });
couponSchema.index({ validUntil: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
