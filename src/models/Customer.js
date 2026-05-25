const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  company: { type: String, trim: true },
  address: { type: String, trim: true },
  brand: { type: String, trim: true },
  model: { type: String, trim: true },
  unit: { type: String, trim: true },
  installDate: { type: String },
  service: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
  },
  amount: {
    type: Number,
    default: 0,
    min: [0, 'Amount cannot be negative'],
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  },
  source: {
    type: String,
    enum: ['admin', 'website'],
    default: 'admin',
  },
  addedBy: { type: String },
  addedDate: { type: String },
  editedBy: { type: String },
  editedDate: { type: String },
}, {
  timestamps: true,
});

customerSchema.index({ name: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });

module.exports = mongoose.model('Customer', customerSchema);
