const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  annualLeaveBalance: {
    type: Number,
    required: true,
    default: 0
  },
  sickLeaveBalance: {
    type: Number,
    required: true,
    default: 0
  },
  carryForward: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one balance record per user per year
leaveBalanceSchema.index({ user: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

module.exports = LeaveBalance; 