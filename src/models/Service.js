const mongoose = require("mongoose");
const slugify = require("slugify");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["installation", "maintenance", "repair", "support"],
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
      enum: [
        "installation",
        "preventative_care",
        "efficiency_tuning",
        "rapid_response",
        "repair",
        "consultation",
        "emergency",
        "inspection",
      ],
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceType: {
      type: String,
      enum: ["fixed", "hourly", "quote"],
      default: "fixed",
    },
    includes: [String],
    exclusions: [String],
    requirements: [String],
    qualifications: [String],
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
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

serviceSchema.index({ category: 1 });
serviceSchema.index({ isFeatured: 1 });

serviceSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + "-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("Service", serviceSchema);
