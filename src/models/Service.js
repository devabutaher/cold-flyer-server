const mongoose = require('mongoose');
const slugify = require('slugify');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  sub: String,
  description: String,
  shortDescription: String,
  icon: String,
  category: {
    type: String,
    enum: ['installation', 'maintenance', 'repair', 'support'],
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
    enum: [
      'installation', 'preventative_care', 'efficiency_tuning',
      'rapid_response', 'repair', 'consultation', 'emergency', 'inspection',
    ],
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  priceType: {
    type: String,
    enum: ['fixed', 'hourly', 'quote'],
    default: 'fixed',
  },
  duration: {
    value: Number,
    unit: { type: String, enum: ['minutes', 'hours', 'days'] },
  },
  coverageArea: [
    {
      zone: String,
      additionalFee: Number,
    },
  ],
  includes: [String],
  exclusions: [String],
  requirements: [String],
  qualifications: [String],
  image: String,
  gallery: [String],
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
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

serviceSchema.index({ category: 1 });
serviceSchema.index({ shop: 1 });
serviceSchema.index({ isFeatured: 1 });

serviceSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);