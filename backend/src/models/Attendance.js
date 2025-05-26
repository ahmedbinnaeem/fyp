const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
      required: true,
  },
  date: {
    type: Date,
      required: true,
  },
  checkIn: {
      time: {
        type: Date,
        required: true,
      },
    location: {
        type: String,
        default: 'Office',
      },
  },
  checkOut: {
      time: {
        type: Date,
      },
    location: {
        type: String,
        default: 'Office',
      },
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late'],
      default: 'present',
  },
  workingHours: {
      hours: {
        type: Number,
        default: 0
      },
      minutes: {
    type: Number,
    default: 0
  },
      total: {
        type: Number,
        default: 0
      }
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index on user and date to ensure unique attendance records per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Middleware to calculate working hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const checkInTime = new Date(this.checkIn.time).getTime();
    const checkOutTime = new Date(this.checkOut.time).getTime();
    const diffInMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
    
    this.workingHours = {
      hours: Math.floor(diffInMinutes / 60),
      minutes: diffInMinutes % 60,
      total: Number((diffInMinutes / 60).toFixed(2))
    };
  } else {
    this.workingHours = {
      hours: 0,
      minutes: 0,
      total: 0
    };
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema); 