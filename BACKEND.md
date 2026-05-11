# ColdFlyer Backend API Specification

## Project Overview

ColdFlyer is an HVAC (Heating, Ventilation, and Air Conditioning) e-commerce platform providing air conditioning units, parts, accessories, and professional installation/maintenance services. This document defines the complete backend architecture, database schemas, API endpoints, and implementation requirements.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing (Firebase in front-end with- email password and google)
- **Validation**:  Zod
- **File Storage**: Cloudinary (for product images, user profile image, service images)
- **Email**: Nodemailer with Mailgun
- **API Documentation**: Swagger/OpenAPI 3.0

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── cloudinary.js      # Cloudinary config
│   │   └── mail.js           # Email service config
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── service.controller.js
│   │   ├── review.controller.js
│   │   ├── shop.controller.js
│   │   ├── payment.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── role.middleware.js     # RBAC checks
│   │   ├── validate.middleware.js # Input validation
│   │   ├── error.middleware.js    # Global error handler
│   │   └── upload.middleware.js    # File upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── Service.js
│   │   ├── ServiceBooking.js
│   │   ├── Review.js
│   │   ├── Shop.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   ├── Address.js
│   │   ├── Notification.js
│   │   ├── Payment.js
│   │   └── Blog.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   ├── service.routes.js
│   │   ├── review.routes.js
│   │   ├── shop.routes.js
│   │   ├── cart.routes.js
│   │   ├── payment.routes.js
│   │   ├── notification.routes.js
│   │   └── admin.routes.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── analytics.service.js
│   │   └── notification.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── catchAsync.js
│   │   ├── generateToken.js
│   │   └── validators.js
│   ├──validators/
│   │   ├── auth.validator.js
│   │   ├── product.validator.js
│   │   ├── order.validator.js
│   │   └── user.validator.js
│   └── app.js
├── .env.example
├── package.json
└── SPEC.md
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },

  // firebase authenticatin use in front end
  password: {
    type: String,
    required: true,
    minLength: 8,
    select: false // Don't return in queries by default
  },
  role: {
    type: String,
    enum: ['customer', 'technician', 'manager', 'admin'],
    default: 'customer'
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
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  addresses: [{
    _id: ObjectId,
    label: String,           // 'Home', 'Office', etc.
    isDefault: Boolean,
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'USA' },
    instructions: String,   // Delivery instructions
    coordinates: {
      lat: Number,
      lng: Number
    }
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
  shop: {
    type: ObjectId,
    ref: 'Shop',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  refreshTokens: [String],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- email: unique
- phone: unique
- role: 1
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
    required: true,
    unique: true
  },
  sub: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  barcode: String,
  productType: {
    type: String,
    enum: ['unit', 'part', 'accessory'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Split AC', 'Window AC', 'Cassette AC', 'Dual Zone AC',
      'Portable AC', 'Floor Standing AC', 'Smart Thermostat',
      'Filters', 'Coils', 'Fan Parts', 'Electronics',
      'Refrigerants', 'Accessories', 'Installation Parts', 'Tools'
    ]
  },
  brand: {
    type: String,
    required: true,
    enum: [
      'ColdFlyer', 'Daikin', 'LG', 'Samsung',
      'Carrier', 'Mitsubishi', 'Hyundai', 'Other'
    ]
  },
  tags: [String],
  warranty: String,
  images: [{
    url: String,
    publicId: String,
    alt: String,
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  }],
  thumbnail: String,
  videoUrl: String,
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'pre_order'],
    default: 'in_stock'
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
  totalSold: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  onSale: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Unit-specific specs
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
    appSupport: String
  },
  features: [String],
  inBox: [String],
  // Parts-specific
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
  compatibility: String,
  batteries: String,
  range: String,
  capacitance: String,
  tolerance: String,
  operatingTemp: String,
  casing: String,
  caseType: String,
  manifoldGauge: String,
  pipeCutter: String,
  pieces: Number
  },
  weight: String,
  dimensions: String,
  shop: {
    type: ObjectId,
    ref: 'Shop',
    required: true
  },
  variants: [{
    _id: ObjectId,
    name: String,           // 'Size', 'Color'
    sku: String,
    priceModifier: Number,
    stock: Number,
    additionalImages: [String],
    options: [{
      label: String,
      value: String,
      priceModifier: Number,
      stock: Number
    }]
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: ObjectId,
    ref: 'User'
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- slug: unique
- sku: unique
- category: 1
- brand: 1
- productType: 1
- price: 1
- rating: -1
- featured: 1
- createdAt: -1
- _text: [[name, description, sub]] // Text search

// Compound Indexes
- { category: 1, brand: 1 }
- { category: 1, price: 1 }
- { featured: 1, rating: -1 }
```

### 3. Order Schema

```javascript
// Model: Order.js
{
  _id: ObjectId,
  orderNumber: {
    type: String,
    required: true,
    unique: true  // Format: CF-2024-00001
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    _id: ObjectId,
    product: {
      type: ObjectId,
      ref: 'Product',
      required: true
    },
    shop: {
      type: ObjectId,
      ref: 'Shop'
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
      options: [{
        label: String,
        value: String
      }]
    }
  }],
  itemCount: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  appliedCoupon: {
    code: String,
    discountType: String,
    discountValue: Number
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: [
      'pending',           // Order created, awaiting payment
      'confirmed',        // Payment confirmed
      'processing',      // Being prepared
      'shipped',          // In transit
      'out_for_delivery', // With delivery partner
      'delivered',       // Completed
      'cancelled',      // Cancelled
      'refunded',       // Refunded
      'failed'          // Payment failed
    ],
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
  paymentId: {
    type: ObjectId,
    ref: 'Payment'
  },
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
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    instructions: String,
    coordinates: { lat: Number, lng: Number }
  },
  isPickup: {
    type: Boolean,
    default: false
  },
  pickupShop: {
    type: ObjectId,
    ref: 'Shop'
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
    default: 'website'
  },
  referralCode: String,
  affiliatePartner: String,
  calledBy: {
    type: ObjectId,
    ref: 'User'
  },
  processedBy: {
    type: ObjectId,
    ref: 'User'
  },
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
  sub: String,
  description: String,
  shortDescription: String,
  icon: String,
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
  duration: {
    value: Number,
    unit: { type: String, enum: ['minutes', 'hours', 'days'] }
  },
  coverageArea: [{
    zone: String,
    additionalFee: Number
  }],
  includes: [String],
  exclusions: [String],
  requirements: [String],
  qualifications: [String],
  image: String,
  gallery: [String],
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shop: {
    type: ObjectId,
    ref: 'Shop',
    required: true
  },
  createdBy: {
    type: ObjectId,
    ref: 'User'
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Service Booking Schema

```javascript
// Model: ServiceBooking.js
{
  _id: ObjectId,
  bookingNumber: {
    type: String,
    required: true,
    unique: true  // Format: SB-2024-00001
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: ObjectId,
    ref: 'Service',
    required: true
  },
  shop: {
    type: ObjectId,
    ref: 'Shop'
  },
  technician: {
    type: ObjectId,
    ref: 'Technician'
  },
  items: [{
    service: ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',        // Awaiting confirmation
      'confirmed',     // Booking confirmed
      'scheduled',     // Date assigned
      'in_progress',   // Service being performed
      'completed',     // Service done
      'cancelled',     // Cancelled
      'rescheduled'    // Date changed
    ],
    default: 'pending'
  },
  scheduledDate: Date,
  scheduledTime: {
    start: String,    // '09:00'
    end: String       // '11:00'
  },
  completedAt: Date,
  propertyDetails: {
    propertyType: String,
    size: String,
    unitCount: Number,
    currentACUnits: String,
    issues: [String]
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
    accessInstructions: String
  },
  diagnosis: String,
  workDone: String,
  partsUsed: [{
    product: ObjectId,
    name: String,
    quantity: Number,
    cost: Number
  }],
  additionalCharges: [{
    description: String,
    amount: Number
  }],
  beforePhotos: [String],
  afterPhotos: [String],
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerReview: String,
  warrantyInfo: String,
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  notes: String,
  internalNotes: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  paymentMethod: String,
  paymentId: ObjectId,
  source: {
    type: String,
    enum: ['website', 'mobile_app', 'phone', 'admin'],
    default: 'website'
  },
  referralCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Shop Schema

```javascript
// Model: Shop.js
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
  logo: String,
  coverImage: String,
  gallery: [String],
  owner: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  managers: [{
    user: ObjectId,
    role: String
  }],
  contact: {
    email: String,
    phone: String,
    mobile: String,
    whatsapp: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  operatingHours: [{
    day: String,
    open: String,
    close: String,
    isClosed: Boolean
  }],
  locations: [{
    name: String,
    address: String,
    coordinates: { lat: Number, lng: Number },
    isMain: Boolean
  }],
  services: [{
    type: String,
    description: String,
    basePrice: Number
  }],
  deliveryZones: [{
    zone: String,
    minOrder: Number,
    deliveryFee: Number,
    estimatedDays: Number
  }],
  settings: {
    currency: { type: String, default: 'USD' },
    taxRate: Number,
    minOrder: Number,
    maxOrder: Number,
    lowStockThreshold: Number
  },
  policies: {
    returnDays: Number,
    warrantyPolicy: String,
    privacyPolicy: String,
    termsOfService: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Technician Schema

```javascript
// Model: Technician.js
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  shop: {
    type: ObjectId,
    ref: 'Shop',
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
  createdAt: Date,
  updatedAt: Date
}
```

### 8. Review Schema

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

### 9. Cart Schema

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
    shop: {
      type: ObjectId,
      ref: 'Shop'
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

### 10. Coupon Schema

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
    enum: ['all', 'products', 'categories', 'brands'],
    default: 'all'
  },
  productIds: [ObjectId],
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

### 11. Blog Schema

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

### 12. Notification Schema

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

### 13. Payment Schema

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

---

## Authentication & Authorization

### User Roles

| Role | Permissions |
|------|-----------|
| `customer` | Manage own profile, orders, cart, wishlist, service bookings |
| `technician` | Customer + update own service jobs |
| `manager` | Technician + manage shop products, orders, technicians |
| `admin` | Full access to all resources |

### JWT Token Structure

```javascript
{
  accessToken: {
    payload: {
      userId: ObjectId,
      email: String,
      role: String,
      shopId: ObjectId (optional)
    },
    expiresIn: '15m'
  },
  refreshToken: {
    payload: {
      userId: ObjectId,
      tokenVersion: Number
    },
    expiresIn: '7d'
  }
}
```

### Permission Matrix

| Resource | Action | Customer | Technician | Manager | Admin |
|---------|--------|----------|------------|---------|-------|
| Users | Read Own | Yes | Yes | Yes | Yes |
| Users | Read All | - | - | - | Yes |
| Users | Update | Own | Own | Own | All |
| Users | Delete | - | - | - | Yes |
| Products | Read | Yes | Yes | Shop Only | Yes |
| Products | Create | - | - | Yes | Yes |
| Products | Update | - | - | Shop Only | Yes |
| Products | Delete | - | - | Shop Only | Yes |
| Orders | Read | Own | - | Shop Only | All |
| Orders | Create | Yes | - | Yes | Yes |
| Orders | Update | - | - | Yes | Yes |
| Services | Read | Yes | Assigned | Shop Only | Yes |
| Services | Book | Yes | - | Yes | Yes |
| Services | Complete | - | Assigned | Yes | Yes |
| Payments | Read | Own | - | Shop Only | All |
| Reviews | Create | Yes | Yes | Yes | Yes |
| Reviews | Moderate | - | - | - | Yes |
| Analytics | Read | - | - | Shop Only | All |

---

## API Endpoints

### Authentication Routes

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout         - Logout user
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/verify-email    - Verify email address
POST   /api/auth/resend-verify    - Resend verification email
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password - Reset password
POST   /api/auth/change-password - Change password (auth required)
GET    /api/auth/me             - Get current user (auth required)
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

POST   /api/products                 - Create product (manager)
PATCH  /api/products/:id             - Update product (manager)
DELETE /api/products/:id             - Delete product (manager)
PATCH  /api/products/:id/stock     - Update stock
```

### Order Routes

```
GET    /api/orders                   - List orders (admin/shop)
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

### Shop Routes

```
GET    /api/shops                    - List shops
GET    /api/shops/:slug              - Get shop details
GET    /api/shops/:slug/products     - Get shop products
GET    /api/shops/:slug/reviews     - Get shop reviews
```

### Review Routes

```
GET    /api/reviews                 - List reviews (admin)
PATCH  /api/reviews/:id/moderate   - Moderate review
DELETE /api/reviews/:id            - Delete review
```

### Payment Routes

```
POST   /api/payments/initiate       - Initiate payment
POST   /api/payments/webhook       - Payment provider webhook
GET    /api/payments/:id           - Get payment details
```

### Blog Routes

```
GET    /api/blogs                  - List blogs
GET    /api/blogs/:slug           - Get blog details
GET    /api/blogs/categories      - Get blog categories

POST   /api/blogs                 - Create blog (admin/manager)
PATCH  /api/blogs/:id             - Update blog
DELETE /api/blogs/:id             - Delete blog
```

### Admin Routes

```
GET    /api/admin/dashboard        - Dashboard stats
GET    /api/admin/analytics        - Analytics data
GET    /api/admin/users           - List all users
PATCH  /api/admin/users/:id       - Update user role
GET    /api/admin/products        - All products
GET    /api/admin/orders          - All orders
GET    /api/admin/services        - All services
GET    /api/admin/reviews        - All reviews
POST   /api/admin/coupons         - Create coupon
GET    /api/admin/coupons         - List coupons
PATCH  /api/admin/coupons/:id     - Update coupon
DELETE /api/admin/coupons/:id    - Delete coupon
GET    /api/admin/technicians      - List technicians
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

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
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

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Implementation Notes

### Security Requirements

1. **Password Hashing**: Use bcrypt with minimum 10 salt rounds
2. **JWT Storage**: Access token in memory, refresh token in httpOnly cookie
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **Input Validation**: Validate all inputs using Joi or Zod
5. **XSS Protection**: Sanitize HTML in user-generated content
6. **CORS**: Allow only frontend domain
7. **Helmet**: Use helmet.js for security headers

### Performance Requirements

1. **Database Indexes**: Create compound indexes for common queries
2. **Pagination**: Maximum 100 items per page
3. **Caching**: Cache hot queries with Redis
4. **Image Optimization**: Use WebP format, max 1200px width
5. **Query Optimization**: Use projection, avoid N+1 queries

### Error Handling

1. All errors caught by global error handler
2. Validation errors return 400
3. Auth errors return 401
4. Permission errors return 403
5. Not found return 404
6. Server errors return 500 with logged details

### Data Seeding

Create seed data with:
- 1 admin user
- 2 shop managers
- 5 technicians
- 1 default shop
- Sample products (from src/data/products-data.js)
- Sample services
- Sample orders

### Testing Requirements

1. Unit tests for controllers/services
2. Integration tests for API endpoints
3. Minimum 80% code coverage
4. Use Jest and Supertest