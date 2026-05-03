const mongoose = require('mongoose');
const slugify = require('slugify');

const imageSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  alt: String,
  isPrimary: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
});

const variantSchema = new mongoose.Schema({
  name: String,
  sku: String,
  priceModifier: Number,
  stock: { type: Number, default: 0 },
  additionalImages: [String],
  options: [
    {
      label: String,
      value: String,
      priceModifier: Number,
      stock: Number,
    },
  ],
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  sub: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  costPrice: {
    type: Number,
    min: 0,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  barcode: String,
  productType: {
    type: String,
    enum: ['unit', 'part', 'accessory'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Split AC', 'Window AC', 'Cassette AC', 'Dual Zone AC',
      'Portable AC', 'Floor Standing AC', 'Smart Thermostat',
      'Filters', 'Coils', 'Fan Parts', 'Electronics',
      'Refrigerants', 'Accessories', 'Installation Parts', 'Tools',
    ],
  },
  brand: {
    type: String,
    required: true,
    enum: [
      'ColdFlyer', 'Daikin', 'LG', 'Samsung',
      'Carrier', 'Mitsubishi', 'Hyundai', 'Other',
    ],
  },
  tags: [String],
  warranty: String,
  images: [imageSchema],
  thumbnail: String,
  videoUrl: String,
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'pre_order'],
    default: 'in_stock',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  totalSold: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  onSale: {
    type: Boolean,
    default: false,
  },
  newArrival: {
    type: Boolean,
    default: false,
  },
  bestSeller: {
    type: Boolean,
    default: false,
  },
  specs: {
    capacity: String,
    voltage: String,
    powerInput: String,
    coverageArea: String,
    noiseLevel: String,
    refrigerant: String,
    starRating: String,
    compressorType: String,
    dimensions: String,
    weight: String,
    display: String,
    connectivity: String,
    compatibility: String,
    powerSource: String,
    operatingTemp: String,
    appSupport: String,
  },
  features: [String],
  inBox: [String],
  compatibility: [String],
  filterClass: String,
  material: String,
  replaceEvery: String,
  dimensions: String,
  packSize: String,
  rows: String,
  finPitch: String,
  maxPressure: String,
  diameter: String,
  blades: String,
  shaftDiameter: String,
  maxRPM: String,
  motorPower: String,
  airflow: String,
  speeds: String,
  ipRating: String,
  type: String,
  gwp: String,
  boilingPoint: String,
  cylinderSize: String,
  purity: String,
  length: String,
  insulation: String,
  pressure: String,
  batteries: String,
  range: String,
  capacitance: String,
  tolerance: String,
  operatingTemp: String,
  casing: String,
  caseType: String,
  manifoldGauge: String,
  pipeCutter: String,
  pieces: Number,
  weight: String,
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  variants: [variantSchema],
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text', sub: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ featured: 1, rating: -1 });

productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }

  if (this.stock === 0) {
    this.stockStatus = 'out_of_stock';
  } else if (this.stock <= this.lowStockThreshold) {
    this.stockStatus = 'low_stock';
  } else {
    this.stockStatus = 'in_stock';
  }

  if (this.originalPrice && this.originalPrice > this.price) {
    this.onSale = true;
  } else {
    this.onSale = false;
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);