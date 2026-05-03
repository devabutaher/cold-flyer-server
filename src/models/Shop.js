const mongoose = require('mongoose');
const slugify = require('slugify');

const operatingHourSchema = new mongoose.Schema({
  day: String,
  open: String,
  close: String,
  isClosed: Boolean,
});

const locationSchema = new mongoose.Schema({
  name: String,
  address: String,
  coordinates: { lat: Number, lng: Number },
  isMain: Boolean,
});

const serviceSchema = new mongoose.Schema({
  type: String,
  description: String,
  basePrice: Number,
});

const deliveryZoneSchema = new mongoose.Schema({
  zone: String,
  minOrder: Number,
  deliveryFee: Number,
  estimatedDays: Number,
});

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shop name is required'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  logo: String,
  coverImage: String,
  gallery: [String],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  managers: [
    {
      user: mongoose.Schema.Types.ObjectId,
      role: String,
    },
  ],
  contact: {
    email: String,
    phone: String,
    mobile: String,
    whatsapp: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    coordinates: { lat: Number, lng: Number },
  },
  operatingHours: [operatingHourSchema],
  locations: [locationSchema],
  services: [serviceSchema],
  deliveryZones: [deliveryZoneSchema],
  settings: {
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    maxOrder: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
  },
  policies: {
    returnDays: Number,
    warrantyPolicy: String,
    privacyPolicy: String,
    termsOfService: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

shopSchema.index({ owner: 1 });
shopSchema.index({ isActive: 1 });

shopSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Shop', shopSchema);