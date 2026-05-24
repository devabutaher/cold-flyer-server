require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cold-flyer';

const coupons = [
  {
    code: 'SUMMER25',
    description: '25% off on all AC units and HVAC systems',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 2000,
    minOrderValue: 5000,
    maxUsage: 100,
    perUserLimit: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'FREESHIP',
    description: 'Free shipping on orders over ৳2,000',
    discountType: 'free_shipping',
    discountValue: 0,
    minOrderValue: 2000,
    maxUsage: 200,
    perUserLimit: 3,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'WELCOME10',
    description: '10% off for first-time customers',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 1000,
    minOrderValue: 0,
    maxUsage: 500,
    perUserLimit: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'FIXED500',
    description: '৳500 off on orders above ৳10,000',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 10000,
    maxUsage: 50,
    perUserLimit: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
  {
    code: 'EXPIRED20',
    description: '20% off — expired coupon for testing',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 1500,
    minOrderValue: 3000,
    maxUsage: 10,
    perUserLimit: 1,
    validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Coupon.deleteMany({});
    console.log('Cleared existing coupons');

    const created = await Coupon.insertMany(coupons);
    console.log(`Seeded ${created.length} coupons`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
