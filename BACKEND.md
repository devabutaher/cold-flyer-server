# ColdFlyer Backend API Specification

## Project Overview

ColdFlyer is an HVAC (Heating, Ventilation, and Air Conditioning) e-commerce platform providing air conditioning units, parts, accessories, and professional installation/maintenance services. This document defines the complete backend architecture, database schemas, API endpoints, and implementation requirements.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT single access token with bcrypt password hashing
- **Validation**: Zod
- **File Storage**: Cloudinary via multer-storage-cloudinary
- **Email**: Nodemailer (SMTP)
- **Payments**: Stripe + SSLCOMMERZ (Bangladesh gateway)
- **Security**: helmet, cors, compression, cookie-parser, express-rate-limit, express-mongo-sanitize

---

## Project Structure

```
cold-flyer-server/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── cloudinary.js      # Cloudinary config
│   │   ├── google.js          # Google OAuth config
│   │   └── mail.js           # Email service config
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── index.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── products.controller.js
│   │   │   ├── orders.controller.js
│   │   │   ├── services.controller.js
│   │   │   ├── reviews.controller.js
│   │   │   ├── users.controller.js
│   │   │   ├── coupons.controller.js
│   │   │   └── technicians.controller.js
│   │   ├── auth.controller.js
│   │   ├── blog.controller.js
│   │   ├── cart.controller.js
│   │   ├── checkout.controller.js
│   │   ├── coupon.controller.js
│   │   ├── order.controller.js
│   │   ├── order-coupon.controller.js
│   │   ├── payment.controller.js
│   │   ├── product.controller.js
│   │   ├── review.controller.js
│   │   ├── service.controller.js
│   │   ├── sslcommerz.controller.js
│   │   ├── user.controller.js
│   │   ├── expense.controller.js
│   │   ├── customer.controller.js
│   │   ├── activity.controller.js
│   │   ├── attendance.controller.js
│   │   ├── location.controller.js
│   │   ├── message.controller.js
│   │   └── report.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification (Bearer + cookie)
│   │   ├── error.middleware.js     # Global error handler
│   │   ├── role.middleware.js      # RBAC checks
│   │   ├── upload.middleware.js    # File upload (Cloudinary)
│   │   └── validate.middleware.js  # Input validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Service.js
│   │   ├── ServiceBooking.js
│   │   ├── Review.js
│   │   ├── Cart.js
│   │   ├── Coupon.js
│   │   ├── Notification.js
│   │   ├── Payment.js
│   │   ├── Technician.js
│   │   ├── Blog.js
│   │   ├── Expense.js
│   │   ├── Customer.js
│   │   ├── ActivityLog.js
│   │   ├── Attendance.js
│   │   ├── LocationLog.js
│   │   ├── MessageLog.js
│   │   ├── JobApplication.js
│   │   └── RecentWork.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── product.routes.js
│   │   ├── review.routes.js
│   │   ├── service.routes.js
│   │   ├── sslcommerz.routes.js
│   │   ├── upload.routes.js
│   │   ├── user.routes.js
│   │   ├── coupon.routes.js
│   │   ├── blog.routes.js
│   │   ├── expense.routes.js
│   │   ├── customer.routes.js
│   │   ├── activity.routes.js
│   │   ├── attendance.routes.js
│   │   ├── location.routes.js
│   │   ├── message.routes.js
│   │   └── jobApplication.routes.js
│   ├── services/
│   │   ├── analytics.service.js
│   │   ├── cloudinary.service.js    # Google avatar upload to avoid 429
│   │   ├── email.service.js
│   │   └── notification.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── catchAsync.js
│   │   ├── generateToken.js
│   │   ├── logger.js
│   │   └── validators.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── product.validator.js
│   │   ├── order.validator.js
│   │   └── user.validator.js
│   └── app.js
├── .env
├── .prettierrc
├── eslint.config.mjs
├── package.json
└── vercel.json
```

---

## Database Schemas

### 1. User Schema

```javascript
// Model: User.js
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 100
  },
  userId: {
    type: String,
    unique: true  // Auto-generated: USR-{random5}
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    select: false // Don't return in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'technician'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
    default: null
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  addresses: [{
    _id: ObjectId,
    label: String,           // 'Home', 'Work', 'Other'
    isDefault: Boolean,
    fullName: String,
    phone: String,
    district: String,        // BD district (select from 65 districts)
    thana: String,           // BD thana/upazila (select from 536 thanas)
    address: String,         // Full street/area/village address
    instructions: String,    // Delivery instructions
  }],
  defaultAddress: {
    type: ObjectId,
    ref: 'Address',
    default: null
  },
  wishlist: [{
    type: ObjectId,
    ref: 'Product'
  }],
  cart: {
    type: ObjectId,
    ref: 'Cart'
  },
  orders: [{
    type: ObjectId,
    ref: 'Order'
  }],
  serviceBookings: [{
    type: ObjectId,
    ref: 'ServiceBooking'
  }],
  technicianProfile: {
    type: ObjectId,
    ref: 'Technician',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- email: unique
- role: 1

### Auth Status Response

`GET /api/auth/status` returns full user object (no `.select()` restriction):
- Includes: `addresses`, `dateOfBirth`, `gender`, `provider`, `emailVerified`
- Same fields as `GET /api/auth/me`
```

### 2. Product Schema

```javascript
// Model: Product.js
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number
  },
  sku: {
    type: String,
    required: true
  },
  productType: {
    type: String,
    enum: ['unit', 'part'],
    default: 'unit'
  },
  category: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  images: [{
    url: String,
    publicId: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  features: [String],
  inBox: [String],
  specs: {
    type: mongoose.Schema.Types.Mixed
  },
  warranty: String,
  tag: {
    type: String,
    enum: ['Sale', 'New', 'Hot', 'Featured', null],
    default: null
  },
  featured: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  onSale: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: ObjectId,
    ref: 'User'
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- category: 1
- brand: 1
- productType: 1
- price: 1
```

### 3. Order Schema

```javascript
// Model: Order.js
{
  _id: ObjectId,
  orderNumber: {
    type: String,
    required: true,
    unique: true  // Format: CF-{year}-{random6}
  },
  user: {
    type: ObjectId,
    ref: 'User'
  },
  items: [{
    _id: ObjectId,
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    sku: String,
    image: String,
    price: Number,
    quantity: Number,
    discount: Number,
    total: Number,
    variant: {
      variantId: ObjectId,
      options: [{ label: String, value: String }]
    }
  }],
  itemCount: Number,
  subtotal: Number,
  discount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  appliedCoupon: {
    code: String,
    discountType: String,
    discountValue: Number
  },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number,
  currency: { type: String, default: 'BDT' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'cod', 'wallet'],
    default: 'card'
  },
  paymentId: String,
  stripeSessionId: String,
  sslcommerzTranId: String,
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    district: String,
    thana: String,
    address: String,
    instructions: String
  },
  isPickup: { type: Boolean, default: false },
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
    default: 'website'
  },
  referralCode: String,
  affiliatePartner: String,
  calledBy: { type: ObjectId, ref: 'User' },
  processedBy: { type: ObjectId, ref: 'User' },
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String,
    updatedBy: ObjectId
  }],
  refundHistory: [{
    amount: Number,
    reason: String,
    requestedAt: Date,
    processedAt: Date,
    processedBy: ObjectId,
    status: String
  }],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- orderNumber: unique
- user: 1
- status: 1
- createdAt: -1
- { user: 1, createdAt: -1 }
- { status: 1, createdAt: -1 }
```

### 4. Service Schema

```javascript
// Model: Service.js
{
  _id: ObjectId,
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  category: {
    type: String,
    enum: ['installation', 'maintenance', 'repair', 'support'],
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: [
      'installation',
      'preventative_care',
      'efficiency_tuning',
      'rapid_response',
      'repair',
      'consultation',
      'emergency',
      'inspection'
    ]
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  priceType: {
    type: String,
    enum: ['fixed', 'hourly', 'quote'],
    default: 'fixed'
  },
  includes: [String],
  exclusions: [String],
  requirements: [String],
  qualifications: [String],
  images: [{
    url: String,
    publicId: String
  }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  bookingCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- category: 1
- isFeatured: 1
```

### 5. Service Booking Schema

```javascript
// Model: ServiceBooking.js
{
  _id: ObjectId,
  bookingNumber: { type: String, unique: true },  // Format: SB-{year}-{random5}
  user: { type: ObjectId, ref: 'User', required: true },
  service: { type: ObjectId, ref: 'Service', required: true },
  technician: { type: ObjectId, ref: 'Technician' },
  items: [{
    service: ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  scheduledDate: Date,
  scheduledTime: { start: String, end: String },
  completedAt: Date,
  propertyDetails: {
    propertyType: String,
    issues: [String]
  },
  serviceAddress: {
    fullName: String,
    phone: String,
    district: String,
    thana: String,
    address: String
  },
  diagnosis: String,
  workDone: String,
  partsUsed: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  additionalCharges: [{
    description: String,
    amount: Number
  }],
  afterPhotos: [String],
  customerRating: { type: Number, min: 1, max: 5 },
  customerReview: String,
  warrantyInfo: String,
  notes: String,
  internalNotes: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'admin'],
    default: 'website'
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- user: 1
- status: 1
- scheduledDate: 1
```

### 6. Technician Schema

```javascript
// Model: Technician.js
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: String,
  specializations: [String],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedAt: Date,
    expiresAt: Date,
    documentUrl: String
  }],
  skills: [{
    skill: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'expert'] }
  }],
  serviceAreas: [{
    zone: String,
    additionalFee: Number
  }],
  availability: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,  // in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'on_leave'],
    default: 'offline'
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  vehicle: {
    type: String,
    make: String,
    model: String,
    year: Number,
    licensePlate: String
  },
  tools: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  hireDate: Date,
  // Worker Management fields (from cold-flyer-old)
  nid: { type: String, trim: true },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
  },
  emergencyContact: { type: String, trim: true },
  salary: { type: Number, default: 0, min: 0 },
  docs: { type: String, trim: true },
  addedBy: { type: String },
  addedDate: { type: String },
  editedBy: { type: String },
  editedDate: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- user: 1
- status: 1
```

### 7. Review Schema

```javascript
// Model: Review.js
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: ObjectId,
    ref: 'Product'
  },
  service: {
    type: ObjectId,
    ref: 'Service'
  },
  technician: {
    type: ObjectId,
    ref: 'Technician'
  },
  booking: {
    type: ObjectId,
    ref: 'ServiceBooking'
  },
  order: {
    type: ObjectId,
    ref: 'Order'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: {
    type: String,
    required: true
  },
  photos: [String],
  videos: [String],
  pros: [String],
  cons: [String],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    user: ObjectId,
    createdAt: Date
  }],
  reportedBy: [{
    user: ObjectId,
    reason: String,
    createdAt: Date
  }],
  adminResponse: {
    comment: String,
    respondedBy: ObjectId,
    createdAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNote: String,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- product: 1, rating: -1
- user: 1
- { product: 1, status: 1 }
```

### 8. Cart Schema

```javascript
// Model: Cart.js
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    _id: ObjectId,
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    sku: String,
    image: String,
    price: Number,
    originalPrice: Number,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    variant: {
      variantId: ObjectId,
      options: [{ label: String, value: String }]
    }
  }],
  subtotal: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  },
  updatedAt: Date
}
```

### 9. Coupon Schema

```javascript
// Model: Coupon.js
{
  _id: ObjectId,
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  maxDiscount: {
    type: Number  // For percentage caps
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableTo: {
    type: String,
    enum: ['all', 'products', 'categories', 'brands', 'services'],
    default: 'all'
  },
  productIds: [ObjectId],
  serviceIds: [ObjectId],
  categoryIds: [String],
  brandIds: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: ObjectId,
    ref: 'User'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 10. Blog Schema

```javascript
// Model: Blog.js
{
  _id: ObjectId,
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  excerpt: String,
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Maintenance', 'Buying Guide', 'Smart Home', 'Tips', 'News'],
    required: true
  },
  tags: [String],
  image: {
    url: String,
    alt: String,
    caption: String
  },
  author: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 11. Notification Schema

```javascript
// Model: Notification.js
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'order_update', 'payment', 'delivery',
      'review', 'promotion', 'service',
      'system', 'price_drop', 'back_in_stock'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    orderId: ObjectId,
    productId: ObjectId,
    serviceId: ObjectId,
    url: String
  },
  image: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: Date
}
```

### 12. Payment Schema

```javascript
// Model: Payment.js
{
  _id: ObjectId,
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: ObjectId,
    ref: 'Order'
  },
  booking: {
    type: ObjectId,
    ref: 'ServiceBooking'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  method: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer', 'wallet'],
    required: true
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'square']
  },
  providerTransactionId: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  cardDetails: {
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number
  },
  refundAmount: Number,
  refundReason: String,
  metadata: Mixed,
  failureMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 13. Expense Schema

```javascript
// Model: Expense.js
{
  _id: ObjectId,
  item: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['rent', 'utilities', 'equipment', 'transport', 'salary', 'marketing', 'other'],
    default: 'other'
  },
  addedBy: { type: String },
  addedDate: { type: String },
  editedBy: { type: String },
  editedDate: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- date: -1
- category: 1
```

### 14. Customer Schema

```javascript
// Model: Customer.js
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true
  },
  customerId: {
    type: String,
    unique: true  // Auto-generated: CUST-{random5}
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  company: { type: String, trim: true },
  address: { type: String, trim: true },
  brand: { type: String, trim: true },
  model: { type: String, trim: true },
  unit: { type: String, trim: true },
  installDate: { type: String },
  service: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  source: {
    type: String,
    enum: ['admin', 'website'],
    default: 'admin'
  },
  addedBy: { type: String },
  addedDate: { type: String },
  editedBy: { type: String },
  editedDate: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- name: 1
- phone: 1
- status: 1
```

### 15. Activity Log Schema

```javascript
// Model: ActivityLog.js
{
  _id: ObjectId,
  user: { type: String },
  userUID: { type: String },
  action: { type: String, required: true },
  detail: { type: String },
  type: {
    type: String,
    enum: ['customer', 'worker', 'expense', 'user', 'login', 'attendance', 'general'],
    default: 'general'
  },
  date: { type: String },
  time: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Auto-prune: max 500 entries (oldest deleted on save)

// Indexes
- date: -1
- type: 1
- userUID: 1
```

### 16. Attendance Schema

```javascript
// Model: Attendance.js
{
  _id: ObjectId,
  worker: {
    type: ObjectId,
    ref: 'Technician',
    required: true
  },
  workerName: { type: String },
  date: {
    type: String,
    required: true
  },
  inTime: {
    type: String,
    required: true
  },
  outTime: { type: String },
  location: { type: String },
  task: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  note: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- { worker: 1, date: 1 } (unique — one record per worker per day)
- date: -1
```

### 17. Location Log Schema

```javascript
// Model: LocationLog.js
{
  _id: ObjectId,
  worker: {
    type: ObjectId,
    ref: 'Technician'
  },
  workerName: { type: String },
  date: { type: String },
  time: { type: String },
  address: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  task: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- date: -1
- { worker: 1, date: -1 }
```

### 18. Message Log Schema

```javascript
// Model: MessageLog.js
{
  _id: ObjectId,
  time: { type: String },
  name: { type: String },
  number: { type: String },
  channel: {
    type: String,
    enum: ['WhatsApp', 'SMS']
  },
  message: { type: String },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- createdAt: -1
```

### 19. JobApplication Schema

```javascript
// Model: JobApplication.js
{
  _id: ObjectId,
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  position: { type: String, required: true },
  message: String,
  resume: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected'],
    default: 'pending'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 20. RecentWork Schema

```javascript
// Model: RecentWork.js
{
  _id: ObjectId,
  title: { type: String, required: true },
  description: String,
  image: { url: String, publicId: String },
  category: String,
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication & Authorization

### User Roles

| Role | Permissions |
|------|-----------|
| `user` | Manage own profile, orders, cart, wishlist, service bookings |
| `technician` | User + update own service jobs |
| `admin` | Full access to all resources |

### JWT Token Structure

```javascript
{
  accessToken: {
    payload: { userId, email, role },
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'   // default .env: 30d
  }
}

Access token sent via `Authorization: Bearer` header or `accessToken` httpOnly cookie.

### Permission Matrix

| Resource | Action | User | Technician | Admin |
|---------|--------|------|------------|-------|
| Users | Read Own | Yes | Yes | Yes |
| Users | Read All | - | - | Yes |
| Users | Update | Own | Own | All |
| Users | Delete | - | - | Yes |
| Products | Read | Yes | Yes | Yes |
| Products | Create | - | - | Yes |
| Products | Update | - | - | Yes |
| Products | Delete | - | - | Yes |
| Orders | Read | Own | - | All |
| Orders | Create | Yes | - | Yes |
| Orders | Update | - | - | Yes |
| Services | Read | Yes | Assigned | Yes |
| Services | Book | Yes | - | Yes |
| Services | Complete | - | Assigned | Yes |
| Payments | Read | Own | - | All |
| Reviews | Create | Yes | Yes | Yes |
| Reviews | Moderate | - | - | Yes |
| Analytics | Read | - | - | All |
```

---

## API Endpoints

### Authentication Routes

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout         - Logout user
POST   /api/auth/google          - Google OAuth login
POST   /api/auth/change-password - Change password (auth required)
POST   /api/auth/send-verification-code - Send email verification (auth required)
POST   /api/auth/verify-email    - Verify email address (auth required)
GET    /api/auth/me             - Get current user (auth required)
GET    /api/auth/status         - Check auth status (public)
```

### User Routes

```
GET    /api/users/profile        - Get own profile
PATCH  /api/users/profile       - Update own profile
PATCH  /api/users/avatar       - Update avatar
GET    /api/users/addresses    - Get addresses
POST   /api/users/addresses    - Add address
PATCH  /api/users/addresses/:id - Update address
DELETE /api/users/addresses/:id - Delete address
PATCH  /api/users/default-address/:id - Set default address
GET    /api/users/orders       - Get own orders
GET    /api/users/wishlist     - Get wishlist
POST   /api/users/wishlist/:productId - Add to wishlist
DELETE /api/users/wishlist/:productId - Remove from wishlist
GET    /api/users/notifications - Get notifications
PATCH  /api/users/notifications/:id/read - Mark as read
```

### Product Routes

```
GET    /api/products                    - List products (with filters)
GET    /api/products/:slug             - Get single product
GET    /api/products/featured          - Get featured products
GET    /api/products/best-sellers     - Get best sellers
GET    /api/products/new-arrivals      - Get new arrivals
GET    /api/products/on-sale         - Get on-sale products
GET    /api/products/search            - Search products
GET    /api/products/categories      - Get categories with counts
GET    /api/products/:id/reviews      - Get product reviews
POST   /api/products/:id/reviews     - Add review

POST   /api/products                 - Create product (admin)
PATCH  /api/products/:id             - Update product (admin)
DELETE /api/products/:id             - Delete product (admin)
PATCH  /api/products/:id/stock     - Update stock
```

### Order Routes

```
GET    /api/orders                   - List orders (admin)
GET    /api/orders/:id                - Get order details
POST   /api/orders                   - Create order
PATCH  /api/orders/:id/status        - Update status
PATCH  /api/orders/:id/cancel        - Cancel order
PATCH  /api/orders/:id/confirm       - Confirm order
POST   /api/orders/:id/refund        - Process refund
GET    /api/orders/:id/invoice        - Get invoice
```

### Cart Routes

```
GET    /api/cart                     - Get cart
POST   /api/cart/items               - Add item to cart
PATCH  /api/cart/items/:id           - Update item quantity
DELETE /api/cart/items/:id           - Remove item
DELETE /api/cart                    - Clear cart
PATCH  /api/cart/apply-coupon        - Apply coupon
DELETE /api/cart/remove-coupon      - Remove coupon
```

### Coupon Routes

```
GET    /api/coupons/lookup/:code     - Lookup coupon by code (30 req/15min rate limit)
GET    /api/coupons                  - List coupons (admin)
POST   /api/coupons                  - Create coupon (admin)
PATCH  /api/coupons/:id              - Update coupon (admin)
DELETE /api/coupons/:id              - Delete coupon (admin)
```

### Service Routes

```
GET    /api/services                 - List services
GET    /api/services/:slug           - Get service details
GET    /api/services/featured        - Get featured services

GET    /api/bookings                 - List bookings
GET    /api/bookings/:id            - Get booking details
POST   /api/bookings                 - Create booking
PATCH  /api/bookings/:id            - Update booking
PATCH  /api/bookings/:id/schedule    - Schedule service
PATCH  /api/bookings/:id/complete    - Complete service
PATCH  /api/bookings/:id/cancel      - Cancel booking
```

### Review Routes

```
GET    /api/reviews                 - List reviews (admin)
PATCH  /api/reviews/:id/moderate   - Moderate review
DELETE /api/reviews/:id            - Delete review
```

### Payment Routes

```
POST   /api/payments/initiate                     - Initiate payment
POST   /api/payments/webhook                      - Stripe webhook (raw body, before JSON parser)
GET    /api/payments/:id                          - Get payment details
POST   /api/payments/sslcommerz/init              - SSLCOMMERZ payment init
POST   /api/payments/sslcommerz/return            - SSLCOMMERZ return
POST   /api/payments/sslcommerz/success           - SSLCOMMERZ success
POST   /api/payments/sslcommerz/fail              - SSLCOMMERZ fail
POST   /api/payments/sslcommerz/cancel            - SSLCOMMERZ cancel
POST   /api/payments/sslcommerz/ipn               - SSLCOMMERZ IPN
```

### Blog Routes

```
GET    /api/blogs                  - List blogs
GET    /api/blogs/:slug           - Get blog details
GET    /api/blogs/categories      - Get blog categories

POST   /api/blogs                 - Create blog (admin)
PATCH  /api/blogs/:id             - Update blog
DELETE /api/blogs/:id             - Delete blog
```

### Expense Routes

```
GET    /api/expenses?category=&startDate=&endDate=&page=&limit=   (returns meta.totalAmount)
GET    /api/expenses/:id
POST   /api/expenses               body: { item, amount, date, category }
PATCH  /api/expenses/:id           body: { any allowed field }
DELETE /api/expenses/:id
```

### Customer Routes

```
GET    /api/customers?search=&status=&page=&limit=
GET    /api/customers/:id
POST   /api/customers              body: { name, phone, email, company, address, brand, model, unit, installDate, service, amount }
PATCH  /api/customers/:id          body: { any allowed field }
DELETE /api/customers/:id
PATCH  /api/customers/:id/toggle
```

### Attendance Routes

```
GET    /api/attendance/today       (returns workers with check-in status)
GET    /api/attendance/history?workerId=&startDate=&endDate=&page=&limit=
POST   /api/attendance/checkin     body: { workerId, location, task, lat, lng }
POST   /api/attendance/checkout    body: { workerId, note }
```

### Location Routes

```
GET    /api/location               (returns workers with latest location + todayLog)
POST   /api/location               body: { workerId, address, lat, lng, task }
```

### Activity Log Routes

```
GET    /api/activity?user=&type=&startDate=&endDate=&page=&limit=   (returns logs + users for filter)
```

### Message Routes

```
GET    /api/messages?channel=&page=&limit=
POST   /api/messages               body: { time, name, number, channel, message }
```

### Admin Routes

```
GET    /api/admin/dashboard        - Dashboard stats
GET    /api/admin/analytics        - Analytics data
GET    /api/admin/users           - List all users
GET    /api/admin/users/:id       - Get single user
PATCH  /api/admin/users/:id       - Update user role
DELETE /api/admin/users/:id       - Delete user
GET    /api/admin/products        - All products
GET    /api/admin/orders          - All orders
GET    /api/admin/services        - All services
GET    /api/admin/reviews        - All reviews
POST   /api/admin/coupons         - Create coupon
GET    /api/admin/coupons         - List coupons
PATCH  /api/admin/coupons/:id     - Update coupon
DELETE /api/admin/coupons/:id    - Delete coupon
PATCH  /api/admin/coupons/:id/toggle - Toggle coupon status
GET    /api/admin/technicians      - List technicians
POST   /api/admin/technicians      - Create technician
GET    /api/admin/technicians/:id  - Get technician
PATCH  /api/admin/technicians/:id  - Update technician
DELETE /api/admin/technicians/:id  - Delete technician
GET    /api/admin/applications     - List job applications
GET    /api/admin/applications/:id - Get application
PATCH  /api/admin/applications/:id/approve - Approve application
PATCH  /api/admin/applications/:id/reject  - Reject application
DELETE /api/admin/applications/:id - Delete application
GET    /api/admin/report?year=&month= - P&L report
GET    /api/admin/report/duplicates?field=phone|address|both - Duplicate customer detection
```

---

## Query Parameters

### Product Filtering

```
GET /api/products?
  category=Split%20AC&
  brand=ColdFlyer&
  minPrice=1000&
  maxPrice=5000&
  minRating=4&
  inStock=true&
  onSale=true&
  sortBy=price_asc|price_desc|rating|newest|popular&
  page=1&
  limit=20
```

### Order Filtering

```
GET /api/orders?
  status=pending|confirmed|shipped|delivered&
  paymentStatus=paid|refunded&
  fromDate=2024-01-01&
  toDate=2024-12-31&
  page=1&
  limit=20
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "code": "VALIDATION_ERROR"
}
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/coldflyer
MONGODB_USER=
MONGODB_PASSWORD=

# Admin seed (used by: npm run seed:admin)
ADMIN_EMAIL=admin@coldflyer.com
ADMIN_PASSWORD=
ADMIN_NAME=Admin

# Google OAuth
GOOGLE_CLIENT_ID=

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@coldflyer.com
EMAIL_FROM_NAME=ColdFlyer

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# SSLCOMMERZ (Bangladesh Payment Gateway)
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWD=
SSLCOMMERZ_IS_LIVE=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

---

## Implementation Notes

### Security Requirements

1. **Password Hashing**: bcrypt with minimum 12 salt rounds
2. **JWT Storage**: Single access token in httpOnly cookie (`path=/`, `sameSite=lax`) or Bearer header
3. **Rate Limiting**: 500 requests per 15 minutes per IP (configurable via env)
4. **Input Validation**: Zod schemas in `src/validators/`
5. **NoSQL Injection**: `express-mongo-sanitize` applied globally
6. **CORS**: Allow only `FRONTEND_URL` (default localhost:3000)
7. **Helmet**: Custom Content-Security-Policy for Stripe, Google, SSLCOMMERZ
8. **File Upload**: MIME filter (jpeg/png/webp/gif only), 5MB max size (`upload.routes.js`)

### Performance Requirements

1. **Database Indexes**: Create compound indexes for common queries
2. **Pagination**: Maximum 100 items per page
3. **Image Optimization**: Use WebP format, max 1200px width
4. **Query Optimization**: Use projection, avoid N+1 queries

### Email Service (`src/services/email.service.js`)

8 functions for transactional emails. All fire-and-forget (`.catch((err) => logger.error(...))`) to avoid blocking responses:

| Function | Trigger | Called From |
|----------|---------|-------------|
| `sendVerificationEmail` | User registration | `auth.controller.js` |
| `sendPasswordResetEmail` | Password reset request | `auth.controller.js` |
| `sendVerificationCode` | Email change / 2FA | `user.controller.js` |
| `sendOrderConfirmationEmail` | Payment success (COD, Stripe, SSLCOMMERZ) | `order.controller.js`, `checkout.controller.js`, `sslcommerz.controller.js`, `payment.routes.js` |
| `sendBookingConfirmationEmail` | Service booking confirmed | `service.controller.js` |
| `sendApplicationReceivedEmail` | Job application submitted | `application.controller.js` |
| `sendApplicationApprovedEmail` | Job application approved | `application.controller.js` |
| `sendApplicationRejectedEmail` | Job application rejected | `application.controller.js` |

### In-App Notification Service (`src/services/notification.service.js`)

7 functions for in-app notifications (stored in `Notification` model):

| Function | Description |
|----------|-------------|
| `createOrderNotification` | Order placed / status change |
| `createPaymentNotification` | Payment received / failed |
| `createServiceNotification` | Service booking update |
| `getUserNotifications` | Fetch notifications for a user (sorted newest first) |
| `markAsRead` | Mark single notification as read |
| `markAllAsRead` | Mark all user notifications as read |
| `getUnreadCount` | Count unread notifications for a user |

### Cloudinary Service (`src/services/cloudinary.service.js`)

Uploads Google OAuth avatar images to Cloudinary to avoid 429 rate limiting from `lh3.googleusercontent.com`:

| Function | Description |
|----------|-------------|
| `uploadGoogleAvatar(imageUrl)` | Uploads a Google avatar URL to Cloudinary `coldflyer/avatars` folder, returns `secure_url` or `null` on failure |

**Used by:** `auth.controller.js` — `googleLogin()` stores Cloudinary URL instead of raw Google CDN URL for both new and returning users.

```js
// Called during Google OAuth sign-in
const avatar = await uploadGoogleAvatar(picture);
```

### Error Handling

1. All errors caught by global error handler
2. Validation errors return 400
3. Auth errors return 401
4. Permission errors return 403
5. Not found return 404
6. Server errors return 500 with logged details

### Data Seeding

```bash
npm run seed         # src/utils/seed.js — seeds 91 records across 12 models
```

Seed data details:
- **Users**: 6 users — 1 admin (`admin@coldflyer.com`), 1 technician (`technician@coldflyer.com`), 4 regular users
- **Products**: 20 products (10 AC units + 10 parts) with categories, brands, specs, `featured`/`bestSeller`/`newArrival` flags, and reviews
- **Services**: 10 services across `installation`/`maintenance`/`repair` categories, each with multiple `serviceType` sub-categories
- **Blogs**: 6 posts with categories (`Tips`, `Buying Guide`, `Industry`, `Maintenance`), SEO metadata, `featured` flags, view counts
- **RecentWorks**: 4 portfolio entries across `installation`/`repair`/`maintenance`/`commercial` categories with before/after images
- **Coupons**: 6 coupons — 4 active (`SUMMER25`, `FREESHIP`, `WELCOME10`, `FIXED500`), 1 expired (`EXPIRED20`), 1 service-only (`SERVICE10`)
- **Technicians**: 2 technicians linked to user accounts, with skills, certifications, service areas
- **Customers**: 10 customers with purchase history and contact info
- **Expenses**: 8 expense records across 4 categories
- **ActivityLogs**: 10 activity log entries across 5 action types
- **Orders**: 5 orders with items, payment status, delivery tracking — auto-prunes to 500 logs via `post('save')` hook
- **ServiceBookings**: 4 bookings across different statuses (pending, confirmed, in_progress, completed)

> **Note:** `pre('save')` hooks for auto-generated `orderNumber`/`bookingNumber` don't fire during `Model.create()` in Mongoose 8.x — seed script provides explicit values (`CF-2026-10001`–`10005`, `SB-2026-00001`–`00004`).

```bash
# Admin created via seed — also auto-assigned via:
# Register with ADMIN_EMAIL in .env to auto-assign admin role
```

### Testing

No test framework configured. The `package.json` has no `test` script and no Jest/Supertest in devDependencies.
