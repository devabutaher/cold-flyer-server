const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  name: String,
  issuedBy: String,
  issuedAt: Date,
  expiresAt: Date,
  documentUrl: String,
});

const skillSchema = new mongoose.Schema({
  skill: String,
  level: { type: String, enum: ['beginner', 'intermediate', 'expert'] },
});

const serviceAreaSchema = new mongoose.Schema({
  zone: String,
  additionalFee: Number,
});

const vehicleSchema = new mongoose.Schema({
  type: String,
  make: String,
  model: String,
  year: Number,
  licensePlate: String,
});

const technicianSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: String,
  specializations: [String],
  certifications: [certificationSchema],
  skills: [skillSchema],
  serviceAreas: [serviceAreaSchema],
  availability: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String },
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  totalJobs: {
    type: Number,
    default: 0,
  },
  completedJobs: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'on_leave'],
    default: 'offline',
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  vehicle: vehicleSchema,
  tools: [String],
  isActive: {
    type: Boolean,
    default: true,
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
}, {
  timestamps: true,
});

technicianSchema.index({ user: 1 });
technicianSchema.index({ status: 1 });

module.exports = mongoose.model('Technician', technicianSchema);