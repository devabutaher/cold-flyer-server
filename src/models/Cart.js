const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String,
  sku: String,
  image: String,
  price: Number,
  originalPrice: Number,
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  variant: {
    variantId: mongoose.Schema.Types.ObjectId,
    options: [{ label: String, value: String }],
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
  },
  itemCount: {
    type: Number,
    default: 0,
  },
  coupon: {
    code: String,
    discountType: String,
    discountValue: Number,
  },
}, {
  timestamps: true,
});

cartSchema.pre('save', function (next) {
  this.subtotal = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.itemCount = this.items.reduce((count, item) => count + item.quantity, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);