const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema({
  service: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  quantity: Number,
});

const partUsedSchema = new mongoose.Schema({
  product: mongoose.Schema.Types.ObjectId,
  name: String,
  quantity: Number,
  cost: Number,
});

const additionalChargeSchema = new mongoose.Schema({
  description: String,
  amount: Number,
});

const serviceBookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
  },
  items: [serviceItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending',
  },
  scheduledDate: Date,
  scheduledTime: {
    start: String,
    end: String,
  },
  completedAt: Date,
  propertyDetails: {
    propertyType: String,
    size: String,
    unitCount: Number,
    currentACUnits: String,
    issues: [String],
  },
  serviceAddress: {
    fullName: String,
    phone: String,
    email: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    coordinates: { lat: Number, lng: Number },
    accessInstructions: String,
  },
  diagnosis: String,
  workDone: String,
  partsUsed: [partUsedSchema],
  additionalCharges: [additionalChargeSchema],
  beforePhotos: [String],
  afterPhotos: [String],
  customerRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  customerReview: String,
  warrantyInfo: String,
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: Date,
  notes: String,
  internalNotes: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending',
  },
  paymentMethod: String,
  paymentId: mongoose.Schema.Types.ObjectId,
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'admin'],
    default: 'website',
  },
  referralCode: String,
}, {
  timestamps: true,
});

serviceBookingSchema.index({ user: 1 });
serviceBookingSchema.index({ status: 1 });
serviceBookingSchema.index({ technician: 1 });
serviceBookingSchema.index({ scheduledDate: 1 });

serviceBookingSchema.pre('save', function (next) {
  if (!this.bookingNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    this.bookingNumber = `SB-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);