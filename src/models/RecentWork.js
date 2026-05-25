const mongoose = require("mongoose");
const slugify = require("slugify");

const imageSchema = new mongoose.Schema({
  url: String,
  alt: String,
  caption: String,
});

const recentWorkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    excerpt: String,
    category: {
      type: String,
      enum: ["Installation", "Maintenance", "Repair", "Commercial", "Residential"],
      required: true,
    },
    tags: [String],
    image: imageSchema,
    clientName: String,
    completionDate: Date,
    featured: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },
  },
  {
    timestamps: true,
  },
);

recentWorkSchema.index({ category: 1 });
recentWorkSchema.index({ featured: 1 });
recentWorkSchema.index({ createdAt: -1 });

recentWorkSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + "-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("RecentWork", recentWorkSchema);
