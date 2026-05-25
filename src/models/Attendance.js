const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    required: true,
  },
  workerName: { type: String },
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  inTime: {
    type: String,
    required: [true, 'Check-in time is required'],
  },
  outTime: { type: String },
  location: { type: String },
  task: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  note: { type: String },
}, {
  timestamps: true,
});

// One record per worker per day
attendanceSchema.index({ worker: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
