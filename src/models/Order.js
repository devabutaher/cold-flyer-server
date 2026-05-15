const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String,
  sku: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  variant: {
    variantId: mongoose.Schema.Types.ObjectId,
    options: [{ label: String, value: String }],
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  note: String,
  updatedBy: mongoose.Schema.Types.ObjectId,
});

const refundHistorySchema = new mongoose.Schema({
  amount: Number,
  reason: String,
  requestedAt: Date,
  processedAt: Date,
  processedBy: mongoose.Schema.Types.ObjectId,
  status: String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [orderItemSchema],
  itemCount: {
    type: Number,
  },
  subtotal: {
    type: Number,
  },
  discount: {
    type: Number,
    default: 0,
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  appliedCoupon: {
    code: String,
    discountType: String,
    discountValue: Number,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'failed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cod', 'wallet'],
    default: 'card',
  },
  paymentId: {
    type: String,
  },
  stripeSessionId: {
    type: String,
  },
  sslcommerzTranId: {
    type: String,
  },
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    instructions: String,
    coordinates: { lat: Number, lng: Number },
  },
  isPickup: {
    type: Boolean,
    default: false,
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  notes: String,
  internalNotes: String,
  adminNotes: String,
  trackingNumber: String,
  trackingUrl: String,
  shipmentId: String,
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'admin', 'api'],
    default: 'website',
  },
  referralCode: String,
  affiliatePartner: String,
  calledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  statusHistory: [statusHistorySchema],
  refundHistory: [refundHistorySchema],
}, {
  timestamps: true,
});

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const { randomInt } = require('crypto');
    const year = new Date().getFullYear();
    const random = randomInt(100000, 999999).toString();
    this.orderNumber = `CF-${year}-${random}`;
  }

  if (this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created',
    });
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);