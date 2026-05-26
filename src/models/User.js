const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  isDefault: { type: Boolean, default: false },
  fullName: String,
  phone: String,
  district: String,
  thana: String,
  address: String,
  instructions: String,
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minLength: [2, 'Name must be at least 2 characters'],
    maxLength: [100, 'Name cannot exceed 100 characters'],
  },
  userId: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'technician'],
    default: 'user',
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  avatar: {
    type: String,
    default: null,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  addresses: [addressSchema],
  defaultAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
    default: null,
  },
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  ],
  serviceBookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceBooking',
    },
  ],
  technicianProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });

userSchema.pre('save', function (next) {
  if (!this.userId) {
    const { randomInt } = require('crypto');
    this.userId = `USR-${randomInt(10000, 99999)}`;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);