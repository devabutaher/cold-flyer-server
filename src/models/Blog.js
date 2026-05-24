const mongoose = require('mongoose');
const slugify = require('slugify');

const imageSchema = new mongoose.Schema({
  url: String,
  alt: String,
  caption: String,
});

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  excerpt: String,
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  category: {
    type: String,
    enum: ['Maintenance', 'Buying Guide', 'Smart Home', 'Tips', 'News'],
    required: true,
  },
  tags: [String],
  image: imageSchema,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  featured: {
    type: Boolean,
    default: false,
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
}, {
  timestamps: true,
});

blogSchema.index({ category: 1 });
blogSchema.index({ featured: 1 });

blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
