const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,
    required: true,
  },
  companyPhone: {
    type: String,
    required: true,
  },
  companyAddress: {
    type: String,
    required: true,
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  }],
  workingHours: {
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
  },
  leaveSettings: {
    annualLeaveQuota: {
      type: Number,
      required: true,
      default: 14,
    },
    sickLeaveQuota: {
      type: Number,
      required: true,
      default: 7,
    },
    carryForwardLimit: {
      type: Number,
      required: true,
      default: 5,
    },
  },
  payrollSettings: {
    payrollCycle: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },
    payDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
      default: 1,
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    overtimeRate: {
      type: Number,
      required: true,
      min: 1,
      default: 1.5,
    },
  },
  emailNotifications: {
    leaveRequests: {
      type: Boolean,
      default: true,
    },
    payrollGeneration: {
      type: Boolean,
      default: true,
    },
    attendanceAlerts: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
settingSchema.pre('save', async function(next) {
  const Setting = this.constructor;
  if (this.isNew) {
    const count = await Setting.countDocuments();
    if (count > 0) {
      const error = new Error('Only one settings document can exist');
      next(error);
    }
  }
  next();
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting; 