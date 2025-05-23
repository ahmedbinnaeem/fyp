const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: Date,
    location: {
      type: { type: String },
      coordinates: []
    }
  },
  checkOut: {
    time: Date,
    location: {
      type: { type: String },
      coordinates: []
    }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late'],
    required: true
  },
  workingHours: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Index for querying attendance by date range
attendanceSchema.index({ user: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 